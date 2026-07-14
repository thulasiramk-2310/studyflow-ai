import { test, expect } from '@playwright/test';

test('Test login and dashboard access', async ({ page }) => {
  // 1. Go to the app
  await page.goto('http://localhost:5173/');

  // 2. We should be on the landing page or login page
  const isLanding = await page.isVisible('text="Study together."');
  if (isLanding) {
    await page.click('text="Log in"');
  }

  // 3. We are at /login. Try logging in with a test account
  await page.fill('input[type="email"]', 'test-pw2@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign in")');
  
  // Wait a bit for network
  await page.waitForTimeout(1000);

  // Check if there is a toast for invalid login
  const hasError = await page.isVisible('text="Invalid email or password"');
  const hasAuthError = await page.isVisible('text="Not authenticated"');
  
  if (hasError || hasAuthError) {
    console.log("Account does not exist or login failed, registering first...");
    // Go to register
    await page.click('text="Create one free"');
    
    // Fill register form
    await page.fill('input[type="text"]', 'Test Playwright User');
    await page.fill('input[type="email"]', 'test-pw2@example.com'); // Use a new email just in case
    await page.fill('input[placeholder="8+ characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'password123');
    await page.click('button:has-text("Create account")');
    
    await page.waitForTimeout(1500);
  }

  // We should be redirected to /dashboard (or wait for the url to change)
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  } catch (e) {
    const html = await page.content();
    console.log("HTML at failure:", html.substring(0, 1500));
    await page.screenshot({ path: 'debug-timeout.png' });
    throw e;
  }
  
  // 4. Verify Dashboard elements
  await expect(page.locator('text=/Welcome (back|to StudyFlow AI)/i').first()).toBeVisible();
  console.log("Successfully logged in and reached Dashboard.");
});
