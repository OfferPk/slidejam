import { expect, test } from '@playwright/test';

test('normal progression live-plays Levels 18–20 and keeps Levels 21–50 hidden', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 18, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Level 18', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 19, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 20, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 21', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Level 18', exact: true }).click();

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

  const solveLevel18: Array<[string, string]> = [
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
  ];
  await solveWithKeyboard(solveLevel18);
  await completeLevel();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(19);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level19 = page.getByRole('group', {
    name: 'Level 19 traffic puzzle board with an exit on the right',
  });
  await expect(level19).toBeFocused();
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]'))
    .toContainText('row 3, columns 1 to 2');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="junction-bus"]'))
    .toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="left-lane-truck"]'))
    .toContainText('truck');

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['junction-bus', 'ArrowUp'],
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
    .toBe(20);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level20 = page.getByRole('group', {
    name: 'Level 20 traffic puzzle board with an exit on the right',
  });
  await expect(level20).toBeFocused();
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-column-car"]'))
    .toContainText('column 3, rows 1 to 2');
  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['junction-bus', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowRight'],
    ['right-lane-car', 'ArrowDown'],
    ['center-lane-car', 'ArrowDown'],
    ['junction-bus', 'ArrowDown'],
    ['center-column-car', 'ArrowDown'],
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
    .toBe(20);
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toHaveCount(0);
  await expect(page.getByText('Traffic cleared. The red target car reached EXIT.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Level 20', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 21', exact: true })).toHaveCount(0);
});
