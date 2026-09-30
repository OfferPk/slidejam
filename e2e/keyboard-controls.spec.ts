import { expect, test } from '@playwright/test';

test('Ctrl+Z undoes a traffic slide and restores the target car position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator(
    'canvas[aria-label="Level 1 traffic puzzle board with an exit on the right"]',
  );
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(board).toBeVisible();
  await expect(target).toContainText('columns 1 to 2');
  await board.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected target car 1 of 4');

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status')).toHaveText('Slid right');
  await expect(target).toContainText('columns 2 to 3');
  await board.press('Control+z');
  await expect(page.getByRole('status')).toHaveText('Undo');
  await expect(target).toContainText('columns 1 to 2');
});

test('off-axis keyboard input explains the vehicle lane constraint', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.locator(
    'canvas[aria-label="Level 1 traffic puzzle board with an exit on the right"]',
  );
  await expect(board).toBeVisible();
  await board.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');

  await expect(page.getByRole('status')).toHaveText(
    'Use left or right to move this vehicle along its lane',
  );
});
