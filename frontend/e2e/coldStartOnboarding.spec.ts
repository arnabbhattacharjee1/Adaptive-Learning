import { test, expect } from '@playwright/test';

test.describe('Cold Start Onboarding Flow & Skill Tree Navigation', () => {
  test('renders cold start onboarding banner and Skill Tree DAG', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Verify Header & Title
    await expect(page.getByRole('heading', { name: /ALIS/i })).toBeVisible();

    // 2. Verify Cold Start Onboarding banner
    await expect(page.getByText('Cold-Start Adaptive Sequencing Engine')).toBeVisible();

    // 3. Verify Skill Tree DAG elements
    await expect(page.getByRole('heading', { name: /Skill Tree Directed Acyclic Graph/i })).toBeVisible();

    // 4. Verify Root node (DSA-101) is present
    await expect(page.getByRole('button', { name: /DSA-101/i })).toBeVisible();
  });

  test('allows registering a new user session', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Open Auth Modal
    await page.getByRole('button', { name: /Sign In /i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Switch to Register
    await page.getByRole('button', { name: /Don't have an account\? Register/i }).click();

    // Fill form
    const email = `e2e_learner_${Date.now()}@example.com`;
    await page.fill('#auth-email', email);
    await page.fill('#auth-password', 'password123');
    await page.fill('#auth-name', 'E2E Learner');

    await page.getByRole('button', { name: /Register & Begin/i }).click();

    // Verify user logged in in header
    await expect(page.getByText('E2E Learner')).toBeVisible();
  });
});
