import { expect, test } from '@playwright/test';

test('final keyboard move wins and completed-board undo stays unavailable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator('canvas[aria-label="SlideJam puzzle board"]');
  await expect(board).toBeVisible();
  await board.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected jar 1 of 1');

  // Level 1 is a single red jar that clears from its matching exit with one move.
  await page.keyboard.press('ArrowRight');
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton).toBeVisible();

  // The win interstitial is still pending here; undo must not restore the cleared jar.
  await board.press('Control+z');
  await expect(page.getByRole('status')).toHaveText('Nothing to undo');

  await continueButton.click();
  await expect(page.getByRole('heading', { name: 'Jar cleared!' })).toBeVisible();
  await expect(page.getByText('Level 1 complete. Next jam unlocks.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).not.toBeVisible();
});
