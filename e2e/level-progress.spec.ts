import { expect, test } from '@playwright/test';

test('level picker shows cleared, unlocked, and locked states from saved progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({
      unlocked: 4,
      adsRemoved: false,
      mute: false,
    }));
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Levels', exact: true }).click();

  await expect(page.locator('#level-progress'))
    .toHaveText('Level 4 unlocked · 3 earlier levels cleared');

  const clearedLevel = page.getByRole('button', { name: 'Level 2', exact: true });
  await expect(clearedLevel).toBeEnabled();
  await expect(clearedLevel).toHaveClass(/completed/);
  await expect(clearedLevel).toHaveAttribute('aria-description', 'Completed');

  const unlockedLevel = page.getByRole('button', { name: 'Level 4', exact: true });
  await expect(unlockedLevel).toBeEnabled();
  await expect(unlockedLevel).toHaveClass(/current/);
  await expect(unlockedLevel).toHaveAttribute('aria-description', 'Current unlocked level');

  const lockedLevel = page.getByRole('button', { name: 'Level 5, locked', exact: true });
  await expect(lockedLevel).toBeDisabled();
  await expect(lockedLevel).toHaveClass(/locked/);
});

test('level picker clamps displayed progress at the final playable level', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('slidejam_v1', JSON.stringify({
      unlocked: 20,
      adsRemoved: false,
      mute: false,
    }));
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Levels', exact: true }).click();

  await expect(page.locator('#level-progress'))
    .toHaveText('Level 20 unlocked · 19 earlier levels cleared');
  const lastClearedLevel = page.getByRole('button', { name: 'Level 19', exact: true });
  await expect(lastClearedLevel).toBeEnabled();
  await expect(lastClearedLevel).toHaveAttribute('aria-description', 'Completed');
  const lastUnlockedLevel = page.getByRole('button', { name: 'Level 20', exact: true });
  await expect(lastUnlockedLevel).toBeEnabled();
  await expect(lastUnlockedLevel).toHaveAttribute('aria-description', 'Current unlocked level');
});
