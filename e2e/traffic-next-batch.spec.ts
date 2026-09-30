import { expect, test } from '@playwright/test';

test('normal progression unlocks and live-plays Level 15, then unlocks Level 16', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 14, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 14', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 16, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 17, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 18, locked', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Level 14', exact: true }).click();

  const solveWithKeyboard = async (moves: Array<[string, string]>, initialSelectedIndex = -1) => {
    const vehicleIds = await page.locator('#vehicle-descriptions li').evaluateAll((items) =>
      items.map((item) => (item as HTMLLIElement).dataset.vehicleId!),
    );
    let selectedIndex = initialSelectedIndex;
    for (const [vehicleId, key] of moves) {
      const nextIndex = vehicleIds.indexOf(vehicleId);
      expect(nextIndex).toBeGreaterThanOrEqual(0);
      if (selectedIndex < 0) {
        await page.keyboard.press('Enter');
        selectedIndex = 0;
      }
      while (selectedIndex !== nextIndex) {
        await page.keyboard.press('Enter');
        selectedIndex = (selectedIndex + 1) % vehicleIds.length;
      }
      await page.keyboard.press(key);
    }
  };

  const solveLevel14: Array<[string, string]> = [
    ['junction-bus', 'ArrowDown'],
    ['center-approach-car', 'ArrowDown'],
    ['upper-row-car', 'ArrowRight'],
    ['center-column-car', 'ArrowUp'],
    ['center-approach-car', 'ArrowUp'],
    ['target-car', 'ArrowRight'],
    ['left-lane-truck', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['target-car', 'ArrowLeft'],
    ['center-lane-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
    ['bottom-row-car', 'ArrowLeft'],
    ['lower-right-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ];
  const level14 = page.getByRole('group', {
    name: 'Level 14 traffic puzzle board with an exit on the right',
  });
  await expect(level14).toBeFocused();
  await solveWithKeyboard(solveLevel14);
  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(15);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level15 = page.getByRole('group', {
    name: 'Level 15 traffic puzzle board with an exit on the right',
  });
  const target15 = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  const status = page.getByRole('status');
  await expect(level15).toBeFocused();
  await expect(level15).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(target15).toContainText('row 3, columns 1 to 2');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="junction-bus"]')).toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="left-lane-truck"]')).toContainText('truck');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('column 6, rows 1 to 2');

  // Illegal target movement stays blocked, while a legal move can be undone and hinted.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Blocked');
  await expect(target15).toContainText('row 3, columns 1 to 2');
  await page.keyboard.press('ArrowUp');
  await expect(status).toHaveText('Use left or right to move this vehicle along its lane');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('rows 3 to 4');
  await level15.press('Control+z');
  await expect(status).toHaveText('Undo');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('rows 1 to 2');
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(status).toHaveText('Hint: slide down');
  await level15.focus();

  const solveLevel15: Array<[string, string]> = [
    ['right-lane-car', 'ArrowDown'],
    ['junction-bus', 'ArrowDown'],
    ['center-approach-car', 'ArrowDown'],
    ['upper-row-car', 'ArrowRight'],
    ['center-column-car', 'ArrowUp'],
    ['center-approach-car', 'ArrowUp'],
    ['target-car', 'ArrowRight'],
    ['left-lane-truck', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['target-car', 'ArrowLeft'],
    ['center-lane-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
    ['bottom-row-car', 'ArrowLeft'],
    ['lower-right-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ];
  await solveWithKeyboard(solveLevel15, 1);
  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(target15).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(16);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level16 = page.getByRole('group', {
    name: 'Level 16 traffic puzzle board with an exit on the right',
  });
  await expect(level16).toBeFocused();
  await expect(level16).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-lane-car"]'))
    .toContainText('rows 3 to 4');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Blocked');
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(status).toHaveText('Hint: slide down');
  await page.getByRole('button', { name: 'Back to levels' }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 16', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 17, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 18, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 50', exact: true })).toHaveCount(0);
});
