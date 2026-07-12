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
    await page.click('text="My Groups"'); // Navigate to groups
    await page.waitForURL('**/groups');
    
    // In Groups page, the button could be "New Group" (header) or "Create Group" (empty state)
    const emptyCreateBtn = await page.isVisible('button:has-text("Create Group")');
    if (emptyCreateBtn) {
      await page.click('button:has-text("Create Group")');
    } else {
      await page.click('button:has-text("New Group")');
    }
    
    await expect(page.locator('text="Create Study Group"').first()).toBeVisible();
    await page.fill('input[placeholder="e.g. Advanced Calculus Study Group"]', 'Resources Test Group');
    await page.fill('textarea[placeholder="What is this group about?"]', 'Test description');
    await page.locator('button:has-text("Create Group")').last().click();
    await page.waitForTimeout(1500);

    // 3. Go to Resources Page
    await page.click('text="Resources"', { force: true });
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
    // 6. Delete file
    await page.hover('text="dummy.md"');
    await page.waitForTimeout(500); // Wait for transition
    
    page.once('dialog', dialog => {
      dialog.accept();
    });
    
    await page.click('button[aria-label="Delete"]', { force: true });
    await page.waitForTimeout(1500); // Give backend time to delete and frontend to refetch
    await expect(page.locator('text="dummy.md"')).not.toBeVisible({ timeout: 10000 });
  });
});
