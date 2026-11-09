import { test, expect } from '@playwright/test';

test.describe('Admin QR Generation & Bulk Standees PDF Printing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/admin/login');
    await page.fill('input[placeholder="Enter username"]', 'admin');
    await page.fill('input[placeholder="Enter password"]', 'Admin@12345');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('text=Patient Feedback & Grievance Monitoring System')).toBeVisible({
      timeout: 15000,
    });
  });

  test('Generate new QR code and verify instant preview', async ({ page }) => {
    await page.goto('/admin/services/qr-generate');
    await page.waitForLoadState('networkidle');

    // Fill counter label
    await page.fill('input[placeholder*="Counter 3"]', 'Counter 5 - Special Senior Citizen Desk');

    // Click Generate
    await page.click('button:has-text("Generate Secure QR Code")');

    // Verify preview image is visible
    await expect(page.locator('img[alt="Generated QR Code"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Copy URL")')).toBeVisible();
  });

  test('Navigate to Bulk QR Print and trigger A4 PDF download', async ({ page }) => {
    await page.goto('/admin/services/bulk-print');
    await page.waitForLoadState('networkidle');

    // Verify multilingual checkboxes
    await expect(page.locator('#include-telugu')).toBeChecked();
    await expect(page.locator('#include-hindi')).toBeChecked();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.click('button:has-text("Download Multi-Page Printable PDF")');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('esushrut-department-qr-standees.pdf');
  });
});
