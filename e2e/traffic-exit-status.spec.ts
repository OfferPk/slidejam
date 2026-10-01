import { expect, test } from '@playwright/test';

test('exit-path status updates after a legal move and undo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 1 traffic puzzle board with an exit on the right',
  });
  const exitStatus = page.locator('#exit-status');
  await expect(board).toBeFocused();
  await expect(exitStatus).toHaveText(
    'Exit path blocked by 2 vehicles: blue bus, yellow car.',
  );

  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(exitStatus).toHaveText(
    'Exit path blocked by 1 vehicle: blue bus.',
  );

  await board.press('Control+z');
  await expect(page.getByRole('status')).toHaveText('Undo');
  await expect(exitStatus).toHaveText(
    'Exit path blocked by 2 vehicles: blue bus, yellow car.',
  );
});
