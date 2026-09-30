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

  await page.keyboard.press('Enter');
  await expect(status).toHaveText('Selected jar 1 of 1');
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
