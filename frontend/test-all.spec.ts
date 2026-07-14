import { test, expect } from '@playwright/test';

test.describe('StudyFlow AI E2E Tests', () => {
  
  const testEmail = `test-e2e-${Date.now()}@example.com`;

  test('Complete user flow: Login/Register, Create Group', async ({ page }) => {
    // 1. Go to the app
    await page.goto('http://localhost:5173/');

    // 2. We should be on the landing page or login page
    const isLanding = await page.isVisible('text="Study together."');
    if (isLanding) {
      await page.click('text="Log in"');
    }

    // 3. We are at /login. Try logging in with a test account
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    
    // Wait for error or navigation
    await page.waitForTimeout(1000);
    const hasError = await page.isVisible('text="Invalid email or password"');
    const hasAuthError = await page.isVisible('text="Not authenticated"');
    
    if (hasError || hasAuthError) {
      console.log("Account does not exist, registering...");
      await page.click('text="Create one free"');
      
      await page.fill('input[type="text"]', 'E2E Test User');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[placeholder="8+ characters"]', 'password123');
      await page.fill('input[placeholder="Repeat password"]', 'password123');
      await page.click('button:has-text("Create account")');
    }

    // 4. Verify Dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('text=/Welcome/i').first()).toBeVisible();

    // 5. Create a Group
    // If empty state "Create Study Group", otherwise use Groups nav link
    const emptyCreateBtn = await page.isVisible('text="Create Study Group"');
    if (emptyCreateBtn) {
      await page.click('text="Create Study Group"');
    } else {
      await page.locator('nav a[href="/groups"], a:has-text("Groups")').first().click({ force: true });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("New Group")').click({ timeout: 6000 });
    }

    // 6. Fill Group Modal
    await expect(page.locator('text="Create Study Group"').first()).toBeVisible();
    await page.fill('input[placeholder="e.g. Advanced Calculus Study Group"]', 'Playwright E2E Group');
    await page.fill('textarea[placeholder="What is this group about?"]', 'Testing with Playwright');
    await page.click('button:has-text("Create Group")');

    // 7. Wait for Group to be created
    await page.waitForTimeout(1500); // give time for modal to close and refetch

    // 8. Assert group is visible on the dashboard or groups list
    await page.click('text=Groups');
    await page.waitForURL('**/groups');
    await expect(page.locator('text="Playwright E2E Group"').first()).toBeVisible();
    
    console.log("E2E Test successfully passed: Logged in, verified dashboard, and created a group.");
  });

});
