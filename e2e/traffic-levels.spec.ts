import { expect, test } from '@playwright/test';

test('fresh progress locks converted levels and never exposes unconverted jar levels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 1, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();

  await expect(page.locator('.level-btn')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeEnabled();
  for (const id of [2, 3, 4]) {
    await expect(page.getByRole('button', { name: `Level ${id}, locked`, exact: true })).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: 'Level 5', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Level 50', exact: true })).toHaveCount(0);
});

test('keyboard solves converted Level 2, completes only at EXIT, and unlocks Level 3', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 2, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await page.getByRole('button', { name: 'Level 2', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 2 traffic puzzle board with an exit on the right',
  });
  const status = page.getByRole('status');
  await expect(board).toBeVisible();
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="crossing-bus"]')).toContainText('bus');
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(target).toContainText('row 3, columns 1 to 2');

  // Select and shift the bottom car so the two vertical blockers can descend.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="lower-clearance-car"]'))
    .toContainText('row 6, columns 1 to 2');
  await expect(target).toContainText('row 3, columns 1 to 2');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toHaveCount(0);

  // Cycle to the bus and lower it one lane to clear target row 3.
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="crossing-bus"]'))
    .toContainText('rows 4 to 6');

  // Move the edge car up and the near-lane car down; neither may change lanes.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="exit-lane-car"]'))
    .toContainText('rows 1 to 2');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="near-lane-car"]'))
    .toContainText('rows 5 to 6');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toHaveCount(0);

  // Only the target's lane-aligned move through EXIT completes the board.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  const dialog = page.getByRole('dialog', { name: 'Ad stub — Interstitial' });
  await expect(dialog).toBeVisible();
  await expect(target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(3);

  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Level 3', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 4, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 5', exact: true })).toHaveCount(0);
});
