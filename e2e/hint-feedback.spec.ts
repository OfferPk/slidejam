import { expect, test } from '@playwright/test';

test('a hint spells out the suggested slide direction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.getByRole('group', { name: 'Level 1 puzzle board' });
  await expect(board).toBeVisible();

  await page.getByRole('button', { name: 'Hint', exact: true }).click();

  await expect(page.getByRole('status')).toHaveText('Hint: slide right');
  await expect(board).toBeVisible();
});
