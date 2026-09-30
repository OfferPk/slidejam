import { expect, test } from '@playwright/test';

test('traffic level entry focuses a named board and exposes the target, bus, truck, and exit objective', async ({ page }) => {
  await page.goto('/');
  const status = page.getByRole('status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toHaveAttribute('aria-atomic', 'true');

  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const board = page.getByRole('group', {
    name: 'Level 1 traffic puzzle board with an exit on the right',
  });
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/press Enter to cycle vehicles/);
  await expect(board).toHaveAccessibleDescription(/drive it through the EXIT on the right/);

  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(target).toHaveText(
    'Red target car, moves only left or right along its lane, at row 3, columns 1 to 2.',
  );
  await expect(board).toHaveAccessibleDescription(/Red target car.*row 3, columns 1 to 2/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="city-bus"]')).toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="delivery-truck"]')).toContainText('truck');

  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Selected target car 1 of 4');
});

test('pointer dragging slides the target only along its lane and updates its accessible position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator(
    'canvas[aria-label="Level 1 traffic puzzle board with an exit on the right"]',
  );
  const start = await board.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pad = 16 * dpr;
    const cell = Math.floor(Math.min(
      (canvas.width - pad * 2) / (6 + 1.25),
      (canvas.height - pad * 2) / 6,
    ));
    const originX = Math.floor((canvas.width - cell * 7.25) / 2);
    const originY = Math.floor((canvas.height - cell * 6) / 2);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: rect.left + (originX + cell) / scaleX,
      y: rect.top + (originY + 2.5 * cell) / scaleY,
      cell: cell / scaleY,
    };
  });

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + start.cell, start.y, { steps: 4 });
  await page.mouse.up();

  await expect(page.getByRole('status')).toHaveText('Slid right');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]'))
    .toHaveText('Red target car, moves only left or right along its lane, at row 3, columns 2 to 3.');
});

test('only converted traffic levels are exposed even when older progress unlocks were saved', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 50, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 3', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 4', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 5', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 6', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 7', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 8', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 9', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 10', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 11', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 12', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 13', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 14', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 15', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 16', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 17', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 18', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 19', exact: true })).toHaveCount(0);
  await expect(page.locator('.level-btn')).toHaveCount(18);
});
