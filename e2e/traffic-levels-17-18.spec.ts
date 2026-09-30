import { expect, test } from '@playwright/test';

test('normal progression live-plays Levels 17–18 and confirms the 20-level catalog', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 16, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Level 16', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 17, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 18, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 19, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 20, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 21', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Level 16', exact: true }).click();

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

  const completeLevel = async () => {
    await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  };

  await expect(page.getByRole('group', {
    name: 'Level 16 traffic puzzle board with an exit on the right',
  })).toBeFocused();
  await solveWithKeyboard([
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
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
  ]);
  await completeLevel();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(17);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level17 = page.getByRole('group', {
    name: 'Level 17 traffic puzzle board with an exit on the right',
  });
  const status = page.getByRole('status');
  const target17 = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(level17).toBeFocused();
  await expect(level17).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(target17).toContainText('row 3, columns 1 to 2');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="junction-bus"]')).toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="left-lane-truck"]')).toContainText('truck');

  // The target is blocked from its start, off-axis motion is rejected, and a legal crossing-car move can be undone.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('No space remains to the right');
  await expect(target17).toContainText('row 3, columns 1 to 2');
  await page.keyboard.press('ArrowUp');
  await expect(status).toHaveText('Use left or right to move this vehicle along its lane');
  const crossingCar17 = page.locator('#vehicle-descriptions li[data-vehicle-id="bottom-crossing-car"]');
  await solveWithKeyboard([['bottom-crossing-car', 'ArrowRight']], 0);
  await expect(crossingCar17).toContainText('row 5, columns 5 to 6');
  await page.keyboard.press('Control+z');
  await expect(status).toHaveText('Undo');
  await expect(crossingCar17).toContainText('row 5, columns 3 to 4');

  await solveWithKeyboard([
    ['bottom-crossing-car', 'ArrowRight'],
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
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
  ], 3);
  await completeLevel();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(18);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level18 = page.getByRole('group', {
    name: 'Level 18 traffic puzzle board with an exit on the right',
  });
  await expect(level18).toBeFocused();
  await expect(level18).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('column 6, rows 4 to 5');
  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowRight'],
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
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
  ]);
  await completeLevel();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(19);
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Level 18', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 19', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 20, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 21', exact: true })).toHaveCount(0);
});
