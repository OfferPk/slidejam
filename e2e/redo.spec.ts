import { expect, test } from '@playwright/test';

test('redo restores an undone slide through the button and keyboard shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator(
    'canvas[aria-label="Level 1 traffic puzzle board with an exit on the right"]',
  );
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  const moveCount = page.locator('#move-count');
  const toast = page.locator('.toast');
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const redo = page.getByRole('button', { name: 'Redo', exact: true });

  await expect(redo).toBeDisabled();
  await board.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(target).toContainText('columns 2 to 3');
  await expect(moveCount).toHaveText('Moves this attempt: 1');

  await undo.click();
  await expect(target).toContainText('columns 1 to 2');
  await expect(moveCount).toHaveText('Moves this attempt: 0');
  await expect(redo).toBeEnabled();

  await redo.click();
  await expect(toast).toHaveText('Redo');
  await expect(target).toContainText('columns 2 to 3');
  await expect(moveCount).toHaveText('Moves this attempt: 1');
  await expect(redo).toBeDisabled();

  await board.focus();
  await page.keyboard.press('Control+z');
  await expect(target).toContainText('columns 1 to 2');
  await expect(moveCount).toHaveText('Moves this attempt: 0');
  await page.keyboard.press('Control+Shift+z');
  await expect(toast).toHaveText('Redo');
  await expect(target).toContainText('columns 2 to 3');
  await expect(moveCount).toHaveText('Moves this attempt: 1');

  await page.keyboard.press('Control+z');
  await page.keyboard.press('Control+y');
  await expect(toast).toHaveText('Redo');
  await expect(target).toContainText('columns 2 to 3');
  await expect(moveCount).toHaveText('Moves this attempt: 1');
});
