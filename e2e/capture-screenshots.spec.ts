import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('eSushrut G5 Screenshots Capture', () => {
  const qrUrl =
    '/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&loc=09c7e400-5200-49ed-85c6-6e8979f20753&t=29c3f5aac9942713c4f37276b8b5d534527f9cc4bf3adb9e36ac253d5ba92c9e';
  const outDir = path.join(__dirname, '../docs/screenshots');

  test('Capture Admin and Mobile Screenshots', async ({ page }) => {
    // 1. Mobile Feedback Form
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(qrUrl);
    await page.waitForLoadState('networkidle');

    // Language
    await page.click('#btn-language-continue');
    // Patient Info
    const randomMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    await page.fill('input[placeholder="e.g. 9876543210"]', randomMobile);
    await page.fill('input[placeholder="Enter full name"]', 'Sunita Sharma');
    await page.click('#btn-patient-info-next');
    await page.waitForTimeout(500);

    // Screenshot 4: Mobile Feedback Form
    await page.screenshot({ path: path.join(outDir, 'mobile-feedback-form.png') });

    // Submit to get Success Screen
    await page.click('#btn-submit-feedback');
    await page.waitForSelector('.display-6', { timeout: 15000 });

    // Screenshot 5: Success Screen with Ticket ID
    await page.screenshot({ path: path.join(outDir, 'success-screen.png') });

    // 2. Desktop View for Admin
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as Admin
    await page.goto('/admin/login');
    await page.fill('input[placeholder="Enter username"]', 'admin');
    await page.fill('input[placeholder="Enter password"]', 'Admin@12345');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('text=Patient Feedback & Grievance Monitoring System', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Screenshot 1: Admin Home Dashboard (3-card layout)
    await page.screenshot({ path: path.join(outDir, 'admin-home.png'), fullPage: true });

    // Screenshot 2: QR Generator
    await page.goto('/admin/services/qr-generate');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Counter 3"]', 'Counter 1 - Main Triage Registration');
    await page.click('button:has-text("Generate Secure QR Code")');
    await page.waitForSelector('img[alt="Generated QR Code"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(outDir, 'qr-generator.png'), fullPage: true });

    // Screenshot 3: Printable QR Sheet
    await page.goto('/admin/services/bulk-print');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'printable-qr-sheet.png'), fullPage: true });

    // Screenshot 6: Reports Dashboard
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'reports-dashboard.png'), fullPage: true });
  });
});
