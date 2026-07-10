import { test, expect } from '@playwright/test';

test.describe('HireMate AI E2E Authentication Flow', () => {

  test('should display login page and elements correctly', async ({ page }) => {
    // Navigate to Login Page
    await page.goto('/login');

    // Verify Title
    await expect(page).toHaveTitle(/HireMate AI/); // Update to actual title

    // Verify HireMate AI is present
    await expect(page.locator('h2', { hasText: 'HireMate' })).toBeVisible();

    // Verify form elements are visible
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should successfully log in as a Founder and log out', async ({ page }) => {
    // Navigate to Login Page
    await page.goto('/login');

    // Fill in credentials
    await page.locator('#email').fill('founder@example.com');
    await page.locator('#password').fill('password123');

    // Click submit button
    await page.locator('button[type="submit"]').click();

    // Verify navigation to Founder Dashboard
    await page.waitForURL('**/founder');
    await expect(page).toHaveURL(/.*founder/);

    // Verify Founder Info in Sidebar is displayed
    await expect(page.locator('text=Founder Account')).toBeVisible();
    await expect(page.locator('text=Alice Vance')).toBeVisible();

    // Logout
    await page.locator('button:has-text("Log Out")').click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should successfully log in as a Candidate and log out', async ({ page }) => {
    // Navigate to Login Page
    await page.goto('/login');

    // Fill in credentials
    await page.locator('#email').fill('candidate@example.com');
    await page.locator('#password').fill('password123');

    // Click submit button
    await page.locator('button[type="submit"]').click();

    // Verify navigation to Candidate Dashboard
    await page.waitForURL('**/candidate');
    await expect(page).toHaveURL(/.*candidate/);

    // Verify Candidate Info in Sidebar is displayed
    await expect(page.locator('text=Candidate Account')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Logout
    await page.locator('button:has-text("Log Out")').click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });

});
