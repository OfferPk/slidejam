import { expect, test } from '@playwright/test';

test('respects the system reduced-motion preference for button and toast feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const muteButton = page.getByRole('button', { name: 'Mute', exact: true });
  const toast = page.locator('.toast');
  const buttonDuration = await muteButton.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(buttonDuration).toBe('0s');

  const hiddenToastStyle = await toast.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      duration: style.transitionDuration,
      translateY: new DOMMatrixReadOnly(style.transform).m42,
    };
  });
  expect(hiddenToastStyle.duration).toBe('0s');
  expect(hiddenToastStyle.translateY).toBe(0);

  await muteButton.hover();
  await page.mouse.down();
  expect(await muteButton.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await page.mouse.up();

  await expect(page.getByRole('button', { name: 'Unmute', exact: true })).toHaveText('Unmute');
  await expect(toast).toHaveClass(/show/);
  const shownToastStyle = await toast.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      duration: style.transitionDuration,
      translateY: new DOMMatrixReadOnly(style.transform).m42,
    };
  });
  expect(shownToastStyle.duration).toBe('0s');
  expect(shownToastStyle.translateY).toBe(hiddenToastStyle.translateY);
});
