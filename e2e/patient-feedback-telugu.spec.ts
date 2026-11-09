import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Patient QR Feedback Flow (Telugu)', () => {
  const qrUrl =
    '/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&loc=09c7e400-5200-49ed-85c6-6e8979f20753&t=29c3f5aac9942713c4f37276b8b5d534527f9cc4bf3adb9e36ac253d5ba92c9e';

  test('Open QR URL, select Telugu, submit review, verify Ticket ID and accessibility', async ({
    page,
  }) => {
    // 1. Open QR URL
    await page.goto(qrUrl);
    await page.waitForLoadState('networkidle');

    // 2. Accessibility Scan on initial load
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // Ignore external library color variance
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // 3. Step 1: Select Telugu language
    await page.click('text=తెలుగు (Telugu)');
    await page.click('#btn-language-continue');

    // 4. Step 2: Patient Info in Telugu
    await expect(page.getByRole('heading', { name: 'రోగి వివరాలు' })).toBeVisible();
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    await page.fill('input[placeholder="e.g. 9876543210"]', testMobile);
    await page.fill('input[placeholder="Enter full name"]', 'రామారావు (Rama Rao)');
    await page.click('#btn-patient-info-next');

    // 5. Step 3: Give Review & Ratings
    await expect(page.locator('text=సమీక్ష & రేటింగ్').first()).toBeVisible();

    // Select overall experience emoji (e.g., 5 - అద్భుతం)
    await page.click('button:has-text("అద్భుతం")');

    // Select NPS score 10
    await page.click('button:has-text("10")');

    // Add comment
    await page.fill(
      'textarea[placeholder="Share any comments or suggestions..."]',
      'వైద్యుల సేవలు చాలా బాగున్నాయి. ధన్యవాదాలు.',
    );

    // Click submit
    await page.click('#btn-submit-feedback');

    // 6. Step 4: Verify Success screen & Ticket ID
    await expect(page.locator('h3:has-text("ధన్యవాదాలు")')).toBeVisible({ timeout: 15000 });
    const ticketIdElement = page.locator('.display-6');
    await expect(ticketIdElement).toBeVisible();
    const ticketText = await ticketIdElement.textContent();
    expect(ticketText).toMatch(/^FB-\d{4}-\d{6}$/);

    // Verify "Track Status" button is present
    await expect(page.locator('button:has-text("స్థితి")')).toBeVisible();
  });
});
