import { expect, test } from '@playwright/test';

test('restart protects moved levels and cancellation keeps the current board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 1 traffic puzzle board with an exit on the right',
  });
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const restart = page.getByRole('button', { name: 'Restart', exact: true });
  const interstitial = page.getByRole('dialog', { name: 'Ad stub — Interstitial' });

  await expect(board).toBeFocused();
  await restart.click();
  await expect(interstitial).toBeVisible();
  await expect(interstitial).toContainText('Reason: restart');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(board).toBeFocused();
  await expect(undo).toBeDisabled();
  await expect(target).toContainText('columns 1 to 2');

  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status')).toHaveText('Slid right');
  await expect(target).toContainText('columns 2 to 3');
  await expect(undo).toBeEnabled();

  await restart.click();
  const confirmation = page.getByRole('dialog', { name: 'Restart this level?' });
  const keepPlaying = confirmation.getByRole('button', { name: 'Keep playing', exact: true });
  await expect(confirmation).toContainText('Your current moves will be lost.');
  await expect(keepPlaying).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(confirmation).not.toBeVisible();
  await expect(restart).toBeFocused();
  await expect(target).toContainText('columns 2 to 3');
  await expect(undo).toBeEnabled();

  await restart.click();
  const secondConfirmation = page.getByRole('dialog', { name: 'Restart this level?' });
  await secondConfirmation.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(interstitial).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(board).toBeFocused();
  await expect(target).toContainText('columns 1 to 2');
  await expect(undo).toBeDisabled();
});
