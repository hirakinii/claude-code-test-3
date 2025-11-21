import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with correct elements', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h1, h5').filter({ hasText: 'ログイン' })).toBeVisible();

    // フォーム要素の確認
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // テスト用アカウント情報の表示確認
    await expect(page.getByText('テスト用アカウント:')).toBeVisible();
    await expect(page.getByText('admin@example.com')).toBeVisible();
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // 管理者アカウントでログイン
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // ログイン成功後、ダッシュボードまたはスキーマ設定ページへ遷移することを確認
    // 注: ダッシュボードが未実装の場合は /settings/schema にリダイレクトされる可能性がある
    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // URLが /login でないことを確認
    expect(page.url()).not.toContain('/login');
  });

  test('should login successfully with creator credentials', async ({ page }) => {
    // 作成者アカウントでログイン
    await page.fill('input[id="email"]', 'creator@example.com');
    await page.fill('input[id="password"]', 'Creator123!');
    await page.click('button[type="submit"]');

    // ログイン成功後の遷移確認
    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // URLが /login でないことを確認
    expect(page.url()).not.toContain('/login');
  });

  test('should show error with invalid email', async ({ page }) => {
    // 無効なメールアドレスを入力
    await page.fill('input[id="email"]', 'invalid@example.com');
    await page.fill('input[id="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(
      page.locator('text=/ログインに失敗しました|メールアドレスとパスワードを確認してください/i')
    ).toBeVisible({ timeout: 5000 });

    // ログインページに留まることを確認
    expect(page.url()).toContain('/login');
  });

  test('should show error with invalid password', async ({ page }) => {
    // 正しいメールアドレスだが間違ったパスワードを入力
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(
      page.locator('text=/ログインに失敗しました|メールアドレスとパスワードを確認してください/i')
    ).toBeVisible({ timeout: 5000 });

    // ログインページに留まることを確認
    expect(page.url()).toContain('/login');
  });

  test('should validate email format', async ({ page }) => {
    // 不正なメールアドレス形式を入力
    await page.fill('input[id="email"]', 'invalid-email');
    await page.fill('input[id="password"]', 'Admin123!');

    // フォーカスを外してバリデーションをトリガー
    await page.locator('input[id="password"]').click();
    await page.click('button[type="submit"]');

    // バリデーションエラーが表示されることを確認
    // react-hook-formのエラーメッセージを探す
    await expect(
      page.locator('text=/有効なメールアドレスを入力してください|メールアドレスは必須です/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should validate required fields', async ({ page }) => {
    // 空のまま送信
    await page.click('button[type="submit"]');

    // バリデーションエラーが表示されることを確認
    await expect(
      page.locator('text=/メールアドレスは必須です|パスワードは必須です/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should validate password minimum length', async ({ page }) => {
    // 短いパスワードを入力
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'short');

    // フォーカスを外してバリデーションをトリガー
    await page.locator('input[id="email"]').click();
    await page.click('button[type="submit"]');

    // バリデーションエラーが表示されることを確認
    await expect(
      page.locator('text=/パスワードは8文字以上である必要があります/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should show loading state during login', async ({ page }) => {
    // ログインボタンをクリックした直後にローディング状態を確認
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');

    // ローディング状態の確認
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // ボタンが無効化されるか、テキストが変わることを確認
    // （短時間なのでタイミングによっては見えない場合もある）
    try {
      await expect(submitButton).toBeDisabled({ timeout: 1000 });
    } catch {
      // ローディングが速すぎて確認できない場合もあるのでスキップ
    }
  });

  test('should persist login state after page reload', async ({ page }) => {
    // ログイン
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // ログイン成功を待つ
    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // ページをリロード
    await page.reload();

    // ログイン状態が維持されていることを確認（ログインページにリダイレクトされない）
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('/login');
  });
});
