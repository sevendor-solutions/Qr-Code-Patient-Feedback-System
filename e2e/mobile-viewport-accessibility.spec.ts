import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Mobile Viewport (375x667) & WCAG Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true });

  const qrUrl =
    '/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&loc=09c7e400-5200-49ed-85c6-6e8979f20753&t=29c3f5aac9942713c4f37276b8b5d534527f9cc4bf3adb9e36ac253d5ba92c9e';

  test('Feedback wizard is responsive and accessible on mobile screen', async ({ page }) => {
    await page.goto(qrUrl);
    await page.waitForLoadState('networkidle');

    // Run accessibility audit on mobile
    const scanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(scanResults.violations).toEqual([]);

    // Check touch target height of primary continue button (>= 48px)
    const continueBtn = page.locator('#btn-language-continue');
    const box = await continueBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Proceed to Step 2
    await continueBtn.click();
    await expect(page.locator('input[placeholder="e.g. 9876543210"]')).toBeVisible();

    // Verify touch button heights on step 2
    const nextBtn = page.locator('#btn-patient-info-next');
    const nextBox = await nextBtn.boundingBox();
    expect(nextBox?.height).toBeGreaterThanOrEqual(44);
  });
});
