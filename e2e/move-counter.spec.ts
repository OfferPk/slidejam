import { expect, test } from '@playwright/test';

test('move counter tracks legal slides, undo, and restart for the current attempt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator(
    'canvas[aria-label="Level 1 traffic puzzle board with an exit on the right"]',
  );
  const count = page.locator('#move-count');
  const status = page.getByRole('status');
  await expect(count).toHaveText('Moves this attempt: 0');

  await board.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await expect(status).toHaveText('No space remains to the left');
  await expect(count).toHaveText('Moves this attempt: 0');

  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Slid right');
  await expect(count).toHaveText('Moves this attempt: 1');

  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(count).toHaveText('Moves this attempt: 0');
  await board.focus();
  await page.keyboard.press('ArrowRight');
  await expect(count).toHaveText('Moves this attempt: 1');

  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Restart this level?' });
  await confirmation.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.getByRole('dialog', { name: 'Ad stub — Interstitial' })
    .getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(count).toHaveText('Moves this attempt: 0');
});
