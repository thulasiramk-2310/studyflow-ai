import { test, expect } from '@playwright/test';

test.describe('Sessions Module E2E Tests', () => {
  const testEmail = `test-sessions-${Date.now()}@example.com`;

  test('Create session and complete it', async ({ page }) => {
    // 1. Register & Login
    await page.goto('http://localhost:5173/register');
    
    // Register
    await page.fill('input[type="text"]', 'Sessions User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder="8+ characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'password123');
    await page.click('button:has-text("Create account")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 2. Create Group
    await page.click('text="Create Study Group"');
    await expect(page.locator('text="Create Study Group"').first()).toBeVisible();
    await page.fill('input[placeholder="e.g. Advanced Calculus Study Group"]', 'Sessions Test Group');
    await page.click('button:has-text("Create Group")');
    await page.waitForTimeout(1000);

    // 3. Go to Sessions Page
    await page.click('text="Sessions"');
    await page.waitForURL('**/sessions');

    // 4. Create Session
    await page.click('button:has-text("Schedule")');
    await expect(page.locator('text="Schedule Study Session"').first()).toBeVisible();
    
    await page.selectOption('select', { label: 'Sessions Test Group' });
    await page.fill('input[placeholder="e.g. Operating Systems Revision"]', 'E2E Test Session');
    
    // Set date to tomorrow
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const dateStr = tmr.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateStr);
    await page.fill('input[type="time"]', '18:00');
    await page.fill('textarea[placeholder="e.g. CPU Scheduling, Deadlocks"]', 'Agenda Item 1\nAgenda Item 2');
    
    await page.click('button[type="submit"]:has-text("Schedule")');
    await page.waitForTimeout(1000);

    // 5. Verify session is listed and click it
    await expect(page.locator('text="E2E Test Session"').first()).toBeVisible();
    await page.click('text="E2E Test Session"');

    // 6. Verify Session Details and Complete
    await page.waitForURL('**/sessions/*');
    await expect(page.locator('text="E2E Test Session"').first()).toBeVisible();
    
    const markCompleteBtn = page.locator('button:has-text("Mark Completed")');
    await expect(markCompleteBtn).toBeVisible();
    await markCompleteBtn.click();

    // 7. Verify Completion State
    await expect(page.locator('text=/Generating Summary/i').first()).toBeVisible();
  });
});
