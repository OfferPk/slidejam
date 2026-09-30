import { expect, test } from '@playwright/test';

test('level entry focuses a named puzzle board and exposes polite action feedback', async ({ page }) => {
  await page.goto('/');
  const status = page.getByRole('status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toHaveAttribute('aria-atomic', 'true');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const board = page.getByRole('group', { name: 'Level 1 puzzle board' });
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/Enter to cycle jars/);
  const redJar = page.locator('#jar-descriptions li[data-jar-id="b1"]');
  await expect(redJar).toHaveText(
    'Red jar, slides left or right along its horizontal axis, at columns 1 to 2, row 2.',
  );
  await expect(board).toHaveAccessibleDescription(/Red jar.*columns 1 to 2, row 2/);

  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Selected jar 1 of 1');
});

test('pointer dragging remains available and updates the accessible jar position', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'slidejam_v1',
      JSON.stringify({ unlocked: 4, adsRemoved: false, mute: false }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator('canvas[aria-label="Level 4 puzzle board"]');
  const start = await board.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pad = 16 * dpr;
    const cell = Math.floor(Math.min(
      (canvas.width - pad * 2) / 5,
      (canvas.height - pad * 2) / 5,
    ));
    const originX = Math.floor((canvas.width - cell * 5) / 2);
    const originY = Math.floor((canvas.height - cell * 5) / 2);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: rect.left + (originX + 1.5 * cell) / scaleX,
      y: rect.top + (originY + 2.5 * cell) / scaleY,
      cell: cell / scaleY,
    };
  });

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - start.cell, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#jar-descriptions li[data-jar-id="b2"]')).toHaveText(
    'Yellow jar, slides up or down along its vertical axis, at column 2, row 2.',
  );
});

test('win interstitial is a named dialog and focus advances to the win heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const board = page.locator('canvas');
  await expect(board).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');

  const dialog = page.getByRole('dialog', { name: 'Ad stub — Interstitial' });
  await expect(dialog).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(continueButton).toBeFocused();
  await page.keyboard.press('Escape');

  const winHeading = page.getByRole('heading', { name: 'Jar cleared!' });
  await expect(winHeading).toBeFocused();
});
