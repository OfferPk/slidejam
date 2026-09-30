import { expect, test } from '@playwright/test';

test('Ctrl+Z undoes a keyboard slide and restores the jar position', async ({ page }) => {
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
  await expect(board).toBeVisible();
  await board.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected jar 2 of 2');

  // In level 4, jar 2 can slide up once without clearing; a second up is blocked.
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('status')).toHaveText('Slid up');
  await board.press('Control+z');
  await expect(page.getByRole('status')).toHaveText('Undo');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('status')).toHaveText('Slid up');
});

test('off-axis keyboard input explains the valid slide directions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator('canvas[aria-label="Level 1 puzzle board"]');
  await expect(board).toBeVisible();
  await board.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');

  await expect(page.getByRole('status')).toHaveText(
    'Use left or right to slide this jar',
  );
});
