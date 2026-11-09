import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('End-to-End Complaint Lifecycle', () => {
  const qrUrl =
    '/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&loc=09c7e400-5200-49ed-85c6-6e8979f20753&t=29c3f5aac9942713c4f37276b8b5d534527f9cc4bf3adb9e36ac253d5ba92c9e';
  const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  let generatedTicketId = '';

  test('Patient raises complaint with photo -> Admin resolves -> Patient tracks live status', async ({
    page,
  }) => {
    // 1. Patient opens QR URL
    await page.goto(qrUrl);
    await page.waitForLoadState('networkidle');

    // Language step
    await page.click('#btn-language-continue');

    // Patient info step
    await page.fill('input[placeholder="e.g. 9876543210"]', testMobile);
    await page.fill('input[placeholder="Enter full name"]', 'Venkatesh Babu');
    await page.click('#btn-patient-info-next');

    // Step 3: Switch to Raise Complaint Tab
    await page.click('text=Raise Query / Complaint');

    // Enter description
    await page.fill(
      'textarea[placeholder*="Please explain the issue"]',
      'The automated token display screen in Room 104 was frozen and patients had to wait without turn.',
    );

    // Select Urgent priority
    await page.check('#priority-urgent');

    // Attach sample photo
    const samplePhotoPath = path.join(__dirname, 'test_sample.png');
    // Valid 8-byte PNG header
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    fs.writeFileSync(samplePhotoPath, pngBuffer);

    try {
      await page.setInputFiles('input[type="file"]', samplePhotoPath);

      // Submit complaint
      await page.click('#btn-submit-complaint');

      // Verify Ticket ID
      await expect(page.locator('.display-6')).toBeVisible({ timeout: 15000 });
      generatedTicketId = (await page.locator('.display-6').textContent())?.trim() || '';
      expect(generatedTicketId).toMatch(/^FB-\d{4}-\d{6}$/);

      // 2. Admin logs in
      await page.goto('/admin/login');
      await page.fill('input[placeholder="Enter username"]', 'admin');
      await page.fill('input[placeholder="Enter password"]', 'Admin@12345');
      await page.click('button:has-text("Sign In")');

      // Verify admin dashboard
      await expect(page.locator('text=Patient Feedback & Grievance Monitoring System')).toBeVisible({
        timeout: 15000,
      });

      // 3. Admin opens Complaints Management
      await page.goto('/admin/services/complaints');
      await page.waitForLoadState('networkidle');

      // Search for the newly generated ticket
      await page.fill('input[placeholder*="Search by ticket ID"]', generatedTicketId);
      await page.waitForTimeout(500);

      // Click "Manage" on the row
      await page.locator('button:has-text("Manage")').first().click();

      // Update status to RESOLVED and add remarks
      await page.selectOption('#modal-update-status', 'RESOLVED');
      await page.fill(
        'textarea[placeholder*="Explain actions taken"]',
        'Hospital IT team rebooted the token display controller in Room 104. Issue fully rectified.',
      );
      await page.click('button:has-text("Save Status & Dispatch SMS Update")');

      // 4. Citizen tracks status online
      await page.goto(`/track?ticketId=${generatedTicketId}&mobile=${testMobile}`);
      await page.waitForLoadState('networkidle');

      // Verify RESOLVED status badge
      await expect(page.locator('.badge-resolved').first()).toBeVisible({ timeout: 15000 });
      await expect(
        page.locator('text=Hospital IT team rebooted the token display controller'),
      ).toBeVisible();
    } finally {
      if (fs.existsSync(samplePhotoPath)) {
        fs.unlinkSync(samplePhotoPath);
      }
    }
  });
});
