import { expect, test } from '@playwright/test';

test('fresh progress locks converted levels and never exposes unconverted jar levels', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 1, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();

  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeEnabled();
  for (let id = 2; id <= 18; id++) {
    await expect(page.getByRole('button', { name: `Level ${id}, locked`, exact: true })).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 19', exact: true })).toHaveCount(0);
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
  await expect(page.getByRole('button', { name: 'Level 5, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 6, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 7, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 8, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 9, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 10, locked', exact: true })).toBeDisabled();
});

test('keyboard solves converted Level 5 and unlocks Level 6 only after the target exits', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 5, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await page.getByRole('button', { name: 'Level 5', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 5 traffic puzzle board with an exit on the right',
  });
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-bus"]')).toContainText('bus');

  const vehicleIds = await page.locator('#vehicle-descriptions li').evaluateAll((items) =>
    items.map((item) => (item as HTMLLIElement).dataset.vehicleId!),
  );
  const solution: Array<[string, string]> = [
    ['right-lane-car', 'ArrowUp'],
    ['lower-left-car', 'ArrowUp'],
    ['center-bus', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['center-bus', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ];
  let selectedIndex = -1;
  for (const [vehicleId, key] of solution) {
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

  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(6);
});

test('Level 7 blocks the target until traffic clears, then Levels 7–8 solve and unlock in order', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 7, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 7', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 8, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 9, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 10, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 11, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 12, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Level 7', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 7 traffic puzzle board with an exit on the right',
  });
  const status = page.getByRole('status');
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(target).toContainText('row 3, columns 1 to 2');

  // Level 7 starts with traffic directly in the target's lane.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Blocked');
  await expect(target).toContainText('row 3, columns 1 to 2');

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

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['lower-left-car', 'ArrowUp'],
    ['center-bus', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['center-bus', 'ArrowDown'],
    ['upper-crossing-car', 'ArrowLeft'],
    ['upper-lane-car', 'ArrowUp'],
    ['target-car', 'ArrowRight'],
  ], 0);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(8);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const nextBoard = page.getByRole('group', {
    name: 'Level 8 traffic puzzle board with an exit on the right',
  });
  const nextTarget = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(nextBoard).toBeFocused();
  await expect(nextBoard).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-approach-car"]'))
    .toContainText('car');

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['lower-left-car', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['upper-crossing-car', 'ArrowLeft'],
    ['upper-lane-car', 'ArrowUp'],
    ['center-approach-car', 'ArrowUp'],
    ['center-bus', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['center-bus', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ]);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(nextTarget).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByText('Traffic cleared. The red target car reached EXIT.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(9);
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 8', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 9', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 10, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 11, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 12, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
});

test('keyboard solves Levels 9–10, preserves blocked moves, hints and undo, and unlocks Level 11', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 9, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 9', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 10, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 11, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 12, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Level 9', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 9 traffic puzzle board with an exit on the right',
  });
  const status = page.getByRole('status');
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(target).toContainText('row 3, columns 1 to 2');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-truck"]'))
    .toContainText('truck');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="top-row-car"]'))
    .toContainText('row 1, columns 4 to 5');

  // Off-axis and blocked target moves leave the target in place.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await expect(status).toHaveText('Use left or right to move this vehicle along its lane');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Blocked');
  await expect(target).toContainText('row 3, columns 1 to 2');

  // A legal move can be undone; Hint still gives the solver's first direction.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('rows 4 to 5');
  await page.keyboard.press('Control+z');
  await expect(status).toHaveText('Undo');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="right-lane-car"]'))
    .toContainText('rows 3 to 4');
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(status).toHaveText('Hint: slide down');
  await board.focus();

  const solveWithKeyboard = async (moves: Array<[string, string]>, initialSelectedIndex: number) => {
    const vehicleIds = await page.locator('#vehicle-descriptions li').evaluateAll((items) =>
      items.map((item) => (item as HTMLLIElement).dataset.vehicleId!),
    );
    let selectedIndex = initialSelectedIndex;
    for (const [vehicleId, key] of moves) {
      const nextIndex = vehicleIds.indexOf(vehicleId);
      expect(nextIndex).toBeGreaterThanOrEqual(0);
      while (selectedIndex !== nextIndex) {
        await page.keyboard.press('Enter');
        selectedIndex = (selectedIndex + 1) % vehicleIds.length;
      }
      await page.keyboard.press(key);
    }
  };

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowDown'],
    ['lower-left-car', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['upper-crossing-car', 'ArrowLeft'],
    ['upper-lane-car', 'ArrowUp'],
    ['top-row-car', 'ArrowRight'],
    ['center-approach-car', 'ArrowUp'],
    ['center-truck', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['center-truck', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ], 1);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(10);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level10Board = page.getByRole('group', {
    name: 'Level 10 traffic puzzle board with an exit on the right',
  });
  const level10Target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(level10Board).toBeFocused();
  await expect(level10Board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="upper-lane-car"]'))
    .toContainText('column 3, rows 3 to 4');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="center-truck"]'))
    .toContainText('truck');

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowDown'],
    ['lower-left-car', 'ArrowUp'],
    ['upper-crossing-car', 'ArrowLeft'],
    ['upper-lane-car', 'ArrowUp'],
    ['target-car', 'ArrowRight'],
    ['lower-middle-car', 'ArrowUp'],
    ['top-row-car', 'ArrowRight'],
    ['center-approach-car', 'ArrowUp'],
    ['center-truck', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['center-truck', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ], -1);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(level10Target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(11);
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  for (let id = 1; id <= 10; id++) {
    await expect(page.getByRole('button', { name: `Level ${id}`, exact: true })).toBeEnabled();
  }
  await expect(page.getByRole('button', { name: 'Level 11', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 12, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 50', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(11);
});

test('keyboard solves Levels 11–12, blocks illegal moves, and unlocks only verified traffic boards', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({ unlocked: 11, adsRemoved: false, mute: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  await expect(page.getByRole('button', { name: 'Level 11', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 12, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 13, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Level 11', exact: true }).click();

  const board = page.getByRole('group', {
    name: 'Level 11 traffic puzzle board with an exit on the right',
  });
  const status = page.getByRole('status');
  const target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(board).toBeFocused();
  await expect(board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(target).toContainText('row 3, columns 1 to 2');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="junction-bus"]')).toContainText('bus');
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="left-lane-truck"]')).toContainText('truck');

  // The target is blocked at its starting square; it cannot change to a vertical lane.
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(status).toHaveText('Blocked');
  await page.keyboard.press('ArrowUp');
  await expect(status).toHaveText('Use left or right to move this vehicle along its lane');
  await expect(target).toContainText('row 3, columns 1 to 2');

  const solveWithKeyboard = async (moves: Array<[string, string]>, initialSelectedIndex: number) => {
    const vehicleIds = await page.locator('#vehicle-descriptions li').evaluateAll((items) =>
      items.map((item) => (item as HTMLLIElement).dataset.vehicleId!),
    );
    let selectedIndex = initialSelectedIndex;
    for (const [vehicleId, key] of moves) {
      const nextIndex = vehicleIds.indexOf(vehicleId);
      expect(nextIndex).toBeGreaterThanOrEqual(0);
      while (selectedIndex !== nextIndex) {
        await page.keyboard.press('Enter');
        selectedIndex = (selectedIndex + 1) % vehicleIds.length;
      }
      await page.keyboard.press(key);
    }
  };

  await solveWithKeyboard([
    ['right-lane-car', 'ArrowUp'],
    ['center-column-car', 'ArrowUp'],
    ['center-approach-car', 'ArrowUp'],
    ['target-car', 'ArrowRight'],
    ['left-lane-truck', 'ArrowUp'],
    ['lower-middle-car', 'ArrowUp'],
    ['target-car', 'ArrowLeft'],
    ['center-lane-car', 'ArrowUp'],
    ['bottom-crossing-car', 'ArrowLeft'],
    ['center-lane-car', 'ArrowDown'],
    ['bottom-row-car', 'ArrowLeft'],
    ['lower-right-car', 'ArrowLeft'],
    ['junction-bus', 'ArrowDown'],
    ['target-car', 'ArrowRight'],
  ], 0);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(12);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();

  const level12Board = page.getByRole('group', {
    name: 'Level 12 traffic puzzle board with an exit on the right',
  });
  const level12Target = page.locator('#vehicle-descriptions li[data-vehicle-id="target-car"]');
  await expect(level12Board).toBeFocused();
  await expect(level12Board).toHaveAccessibleDescription(/EXIT on the right/);
  await expect(page.locator('#vehicle-descriptions li[data-vehicle-id="upper-row-car"]')).toContainText('car');

  await solveWithKeyboard([
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
  ], -1);

  await expect(page.getByRole('dialog', { name: 'Ad stub — Interstitial' })).toBeVisible();
  await expect(level12Target).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Target vehicle escaped!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('slidejam_v1') ?? '{}').unlocked))
    .toBe(13);

  await page.getByRole('button', { name: 'Levels', exact: true }).click();
  await expect(page.locator('.level-btn')).toHaveCount(18);
  for (let id = 1; id <= 13; id++) {
    await expect(page.getByRole('button', { name: `Level ${id}`, exact: true })).toBeEnabled();
  }
  await expect(page.getByRole('button', { name: 'Level 13', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 14, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 15, locked', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Level 50', exact: true })).toHaveCount(0);
});
