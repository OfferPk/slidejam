import { expect, test } from '@playwright/test';

test('a traffic hint spells out the suggested slide direction', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 1 traffic puzzle board with an exit on the right',
  });
  await expect(board).toBeVisible();

  await page.getByRole('button', { name: 'Hint', exact: true }).click();

  await expect(page.getByRole('status')).toHaveText('Hint: slide left');
  await expect(board).toBeVisible();
});
