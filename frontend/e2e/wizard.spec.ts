import { test, expect } from '@playwright/test';

test.describe('Wizard Page', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('input[id="email"]', 'creator@example.com');
    await page.fill('input[id="password"]', 'Creator123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should create a new specification and navigate to wizard', async ({
    page,
  }) => {
    // Click new specification button
    await page.click('button:has-text("新規作成")');

    // Wait for modal to appear and click create
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');

    // Should navigate to wizard edit page
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Verify wizard page elements
    await expect(page.locator('h1, h4').filter({ hasText: '仕様書作成' })).toBeVisible();
  });

  test('should display stepper with all steps', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Verify stepper exists with steps
    await expect(page.locator('.MuiStepper-root')).toBeVisible();
    await expect(page.locator('.MuiStep-root')).toHaveCount(6); // 6 steps in default schema
  });

  test('should navigate between steps using next/back buttons', async ({
    page,
  }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Should be on first step
    await expect(page.locator('button:has-text("前へ")')).toBeDisabled();
    await expect(page.locator('button:has-text("次へ")')).toBeEnabled();

    // Click next
    await page.click('button:has-text("次へ")');

    // Now back button should be enabled
    await expect(page.locator('button:has-text("前へ")')).toBeEnabled();

    // Click back
    await page.click('button:has-text("前へ")');

    // Back to first step
    await expect(page.locator('button:has-text("前へ")')).toBeDisabled();
  });

  test('should navigate to step by clicking stepper', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Click on step 3 in stepper
    const stepButtons = page.locator('.MuiStepButton-root');
    await stepButtons.nth(2).click();

    // Back button should be enabled (we're not on first step)
    await expect(page.locator('button:has-text("前へ")')).toBeEnabled();
  });

  test('should fill in text fields', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Fill in first text field (件名)
    const textFields = page.locator('input[type="text"]');
    if ((await textFields.count()) > 0) {
      await textFields.first().fill('テスト仕様書');
      await expect(textFields.first()).toHaveValue('テスト仕様書');
    }
  });

  test('should add and remove list items (deliverables)', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Navigate to step with deliverables (step 3)
    const stepButtons = page.locator('.MuiStepButton-root');
    await stepButtons.nth(2).click();

    // Find and click add button
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Should show item #1
      await expect(page.locator('text=#1')).toBeVisible();

      // Fill in the item
      const nameField = page.locator('input').filter({ hasText: /納品物名|名/ }).first();
      if (await nameField.isVisible()) {
        await nameField.fill('テスト納品物');
      }

      // Delete the item
      const deleteButton = page.locator('button').filter({ has: page.locator('[data-testid="DeleteIcon"]') }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await expect(page.locator('text=#1')).not.toBeVisible();
      }
    }
  });

  test('should show auto-save indicator', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Fill in a text field to trigger auto-save
    const textFields = page.locator('input[type="text"]');
    if ((await textFields.count()) > 0) {
      await textFields.first().fill('自動保存テスト');

      // Wait for auto-save indicator
      await page.waitForTimeout(600); // debounce is 500ms

      // Check for last saved text
      await expect(page.locator('text=/最終保存/')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show save button on last step', async ({ page }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Navigate to last step
    const stepButtons = page.locator('.MuiStepButton-root');
    const lastStepIndex = (await stepButtons.count()) - 1;
    await stepButtons.nth(lastStepIndex).click();

    // Should show save button instead of next
    await expect(page.locator('button:has-text("保存")')).toBeVisible();
    await expect(page.locator('button:has-text("次へ")')).not.toBeVisible();
  });

  test('should save specification and redirect to dashboard', async ({
    page,
  }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Navigate to last step
    const stepButtons = page.locator('.MuiStepButton-root');
    const lastStepIndex = (await stepButtons.count()) - 1;
    await stepButtons.nth(lastStepIndex).click();

    // Click save
    await page.click('button:has-text("保存")');

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should restore data from localStorage after reload', async ({
    page,
  }) => {
    // Create specification and navigate to wizard
    await page.click('button:has-text("新規作成")');
    await expect(page.locator('text=新規仕様書を作成')).toBeVisible();
    await page.click('button:has-text("作成")');
    await page.waitForURL(/\/specifications\/.*\/edit/, { timeout: 10000 });

    // Fill in a text field
    const textFields = page.locator('input[type="text"]');
    if ((await textFields.count()) > 0) {
      await textFields.first().fill('ローカルストレージテスト');

      // Wait for auto-save
      await page.waitForTimeout(600);

      // Get current URL for reload
      const url = page.url();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should restore the value
      await expect(textFields.first()).toHaveValue('ローカルストレージテスト');
    }
  });
});
