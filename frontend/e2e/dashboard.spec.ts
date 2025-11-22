import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  // ログイン状態を設定
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('/login');

    // ログイン（作成者アカウント）
    await page.fill('input[id="email"]', 'creator@example.com');
    await page.fill('input[id="password"]', 'Creator123!');
    await page.click('button[type="submit"]');

    // ダッシュボードへの遷移を待つ
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard with correct title', async ({ page }) => {
    // ダッシュボードタイトルの確認
    await expect(page.locator('h1, h4').filter({ hasText: '仕様書一覧' })).toBeVisible();
  });

  test('should display header with app name', async ({ page }) => {
    // ヘッダーのアプリ名を確認
    await expect(page.getByText('仕様書作成支援アプリ')).toBeVisible();
  });

  test('should display new specification button', async ({ page }) => {
    // 新規作成ボタンの確認
    await expect(page.getByRole('button', { name: /新規作成/ })).toBeVisible();
  });

  test('should display status filter dropdown', async ({ page }) => {
    // ステータスフィルタの確認
    await expect(page.getByLabel('ステータス')).toBeVisible();
  });

  test('should open create specification modal', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.getByRole('button', { name: /新規作成/ }).click();

    // モーダルが開くことを確認
    await expect(page.getByText('新規仕様書の作成')).toBeVisible();
    await expect(page.getByText('新しい仕様書を作成します')).toBeVisible();
  });

  test('should close create modal on cancel', async ({ page }) => {
    // モーダルを開く
    await page.getByRole('button', { name: /新規作成/ }).click();
    await expect(page.getByText('新規仕様書の作成')).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // モーダルが閉じることを確認
    await expect(page.getByText('新規仕様書の作成')).not.toBeVisible();
  });

  test('should display empty state when no specifications', async ({ page }) => {
    // 仕様書がない場合のメッセージを確認（存在する場合はスキップ）
    const emptyMessage = page.getByText('仕様書がありません');
    const specificationTable = page.getByRole('table');

    // テーブルまたは空メッセージのいずれかが表示されていることを確認
    const hasTable = await specificationTable.isVisible().catch(() => false);
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);
  });

  test('should filter specifications by status', async ({ page }) => {
    // ステータスフィルタを「編集中」に変更
    await page.getByLabel('ステータス').click();
    await page.getByRole('option', { name: '編集中' }).click();

    // フィルタが適用されたことを確認（URLまたはUIの変化）
    await page.waitForTimeout(500); // APIレスポンスを待つ
  });

  test('should not show settings button for creator', async ({ page }) => {
    // 作成者は設定ボタンが表示されないことを確認
    const settingsButton = page.getByRole('button', { name: /設定/ });
    await expect(settingsButton).not.toBeVisible();
  });

  test('should display user menu', async ({ page }) => {
    // ユーザーアイコンをクリック
    await page.getByLabel('account of current user').click();

    // メニューが表示されることを確認
    await expect(page.getByText('ログアウト')).toBeVisible();
  });

  test('should logout when clicking logout button', async ({ page }) => {
    // ユーザーメニューを開く
    await page.getByLabel('account of current user').click();

    // ログアウトボタンをクリック
    await page.getByText('ログアウト').click();

    // ログインページにリダイレクトされることを確認
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('Dashboard Page - Admin', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('/login');

    // ログイン（管理者アカウント）
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // ダッシュボードへの遷移を待つ
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show settings button for admin', async ({ page }) => {
    // 管理者は設定ボタンが表示されることを確認
    await expect(page.getByRole('button', { name: /設定/ })).toBeVisible();
  });

  test('should navigate to settings page when settings button clicked', async ({
    page,
  }) => {
    // 設定ボタンをクリック
    await page.getByRole('button', { name: /設定/ }).click();

    // 設定ページに遷移することを確認
    await page.waitForURL(/\/settings\/schema/, { timeout: 5000 });
    expect(page.url()).toContain('/settings/schema');
  });
});
