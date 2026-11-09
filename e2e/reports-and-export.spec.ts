import { test, expect } from '@playwright/test';

test.describe('Reports & Analytics Exports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[placeholder="Enter username"]', 'admin');
    await page.fill('input[placeholder="Enter password"]', 'Admin@12345');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Patient Feedback & Grievance Monitoring System')).toBeVisible({
      timeout: 15000,
    });
  });

  test('Verify KPI metrics, graphs, and export to Excel (.xlsx)', async ({ page }) => {
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');

    // Verify Title
    await expect(
      page.locator('text=Healthcare Feedback Analytics & Audit Reports'),
    ).toBeVisible();

    // Verify Charts rendered
    await expect(page.locator('canvas').first()).toBeVisible();

    // Verify Excel Download
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Export Excel")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('esushrut-feedback-report.xlsx');
  });
});
