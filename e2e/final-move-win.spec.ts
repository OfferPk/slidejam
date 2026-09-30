import { expect, test } from '@playwright/test';

test('traffic level preserves controls and wins only when the target car reaches EXIT', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 1 traffic puzzle board with an exit on the right',
  });
  await expect(board).toBeVisible();
  await expect(board).toBeFocused();
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="city-bus"]')).toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="delivery-truck"]')).toContainText('truck');
  await expect(board).toHaveAccessibleDescription(/drive it through the EXIT on the right/);

  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(target).toHaveText(
    'Red target car, moves only left or right along its lane, at row 3, columns 1 to 2.',
  );

  // The bus blocks the exit lane. A premature target move stops at the bus, then undo restores it.
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected target car 1 of 4');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status')).toHaveText('Slid right');
  await expect(target).toContainText('columns 2 to 3');
  await board.press('Control+z');
  await expect(page.getByRole('status')).toHaveText('Undo');
  await expect(target).toContainText('columns 1 to 2');

  // The bus is blocked by the truck until the truck slides left within its own lane.
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected bus 2 of 4');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('status')).toHaveText('No space remains to the down');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Selected truck 3 of 4');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('status')).toHaveText('Slid left');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="delivery-truck"]'))
    .toContainText('columns 1 to 3');

  // Move the right-lane car, then send the bus down to clear the target's lane.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('status')).toHaveText('Slid down');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('status')).toHaveText('Slid down');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="city-bus"]'))
    .toContainText('rows 4 to 6');

  // Cycle back to the red target and drive it through the now-clear right-side exit.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');

  const interstitial = page.getByRole('dialog', { name: 'Ad stub — Interstitial' });
  await expect(interstitial).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeFocused();
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]')).toHaveCount(0);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="city-bus"]')).toBeVisible();
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="delivery-truck"]')).toBeVisible();

  // Keep keyboard focus within the one-control interstitial before its win transition.
  await page.keyboard.press('Tab');
  await expect(continueButton).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(interstitial).not.toBeVisible();

  const winHeading = page.getByRole('heading', { name: 'Target vehicle escaped!' });
  await expect(winHeading).toBeVisible();
  await expect(winHeading).toBeFocused();
  await expect(page.getByText('Traffic cleared. The red target car reached EXIT.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).not.toBeVisible();
});
