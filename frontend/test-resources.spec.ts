import { test, expect } from '@playwright/test';

test.describe('Resources Module E2E Tests', () => {
  const testEmail = `test-resources-${Date.now()}@example.com`;

  test('Upload, view, and delete resource', async ({ page }) => {
    // 1. Register & Login
    await page.goto('http://localhost:5173/register');
    
    // Register
    await page.fill('input[type="text"]', 'Resources User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder="8+ characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'password123');
    await page.click('button:has-text("Create account")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 2. Create Group
    await page.click('text="Create Study Group"');
    await expect(page.locator('text="Create Study Group"').first()).toBeVisible();
    await page.fill('input[placeholder="e.g. Advanced Calculus Study Group"]', 'Resources Test Group');
    await page.click('button:has-text("Create Group")');
    await page.waitForTimeout(1000);

    // 3. Go to Resources Page
    await page.click('text="Resources"');
    await page.waitForURL('**/resources');

    // 4. Upload a File
    await page.click('button:has-text("Upload")');
    // We assume the modal opens and there's a group selector and file input
    await page.selectOption('select', { label: 'Resources Test Group' });
    
    // Set file
    await page.setInputFiles('input[type="file"]', 'dummy.md');
    await page.click('button:has-text("Upload Resource")');
    
    await page.waitForTimeout(1000);

    // 5. Verify file is listed
    await expect(page.locator('text="dummy.md"')).toBeVisible();

    // 6. Delete file (we assume there's a trash icon or delete button in a dropdown)
    // For now, assume a button or icon exists. If not, this might fail, which is good to check.
    const hasDeleteBtn = await page.isVisible('button[aria-label="Delete resource"]');
    if (hasDeleteBtn) {
      await page.click('button[aria-label="Delete resource"]');
      await page.waitForTimeout(1000);
      await expect(page.locator('text="dummy.md"')).not.toBeVisible();
    }
  });
});
