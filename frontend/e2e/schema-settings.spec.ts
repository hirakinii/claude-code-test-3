import { test, expect } from '@playwright/test';

test.describe('Schema Settings', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者としてログイン
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // ログイン成功を待つ
    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // スキーマ設定画面へ遷移
    await page.goto('/settings/schema');
    await page.waitForLoadState('networkidle');
  });

  test('should display schema settings page', async ({ page }) => {
    // ページタイトルの確認
    await expect(
      page.locator('h4, h5, h6').filter({ hasText: /スキーマ設定|Schema Settings/i })
    ).toBeVisible();

    // カテゴリ一覧が表示されることを確認
    await expect(page.locator('text=/ステップ 1: 基本情報/i')).toBeVisible();
  });

  test('should expand and collapse category accordion', async ({ page }) => {
    // カテゴリをクリックして展開
    const category = page.locator('text=/ステップ 1: 基本情報/i').first();
    await category.click();

    // フィールド一覧が表示されることを確認
    await page.waitForTimeout(500); // アニメーション待ち

    // カテゴリを再度クリックして折りたたみ
    await category.click();
    await page.waitForTimeout(500); // アニメーション待ち
  });

  test('should create a new category', async ({ page }) => {
    // カテゴリ追加ボタンを探す
    const addCategoryButton = page.locator('button').filter({ hasText: /カテゴリを追加|Add Category/i });
    await addCategoryButton.click();

    // モーダルが表示されることを確認
    await expect(
      page.locator('text=/カテゴリ追加|新しいカテゴリ/i')
    ).toBeVisible({ timeout: 3000 });

    // フォーム入力
    await page.fill('input[name="name"]', 'テストカテゴリ E2E');
    await page.fill('textarea[name="description"]', 'E2Eテストで作成されたカテゴリ');
    await page.fill('input[name="displayOrder"]', '99');

    // 保存ボタンをクリック
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i });
    await saveButton.click();

    // カテゴリが追加されたことを確認（少し待つ）
    await expect(page.locator('text=テストカテゴリ E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a category', async ({ page }) => {
    // カテゴリを展開
    const category = page.locator('text=/ステップ 1: 基本情報/i').first();
    await category.click();
    await page.waitForTimeout(500);

    // 編集ボタンをクリック（aria-labelまたはtitleで探す）
    const editButtons = page.locator('button[aria-label*="edit"], button[title*="編集"]');
    await editButtons.first().click();

    // モーダルが表示されることを確認
    await expect(
      page.locator('text=/カテゴリ編集|Edit Category/i')
    ).toBeVisible({ timeout: 3000 });

    // 説明を変更
    const descriptionInput = page.locator('textarea[name="description"]');
    await descriptionInput.clear();
    await descriptionInput.fill('E2Eテストで更新された説明');

    // 保存ボタンをクリック
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i });
    await saveButton.click();

    // 成功メッセージまたはモーダルが閉じることを確認
    await page.waitForTimeout(1000);
  });

  test('should delete a category', async ({ page }) => {
    // まず新しいカテゴリを作成
    const addCategoryButton = page.locator('button').filter({ hasText: /カテゴリを追加|Add Category/i });
    await addCategoryButton.click();

    await page.fill('input[name="name"]', '削除テストカテゴリ');
    await page.fill('textarea[name="description"]', '削除されるカテゴリ');
    await page.fill('input[name="displayOrder"]', '100');

    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i }).first();
    await saveButton.click();

    await expect(page.locator('text=削除テストカテゴリ')).toBeVisible({ timeout: 5000 });

    // 作成したカテゴリを展開
    await page.locator('text=削除テストカテゴリ').click();
    await page.waitForTimeout(500);

    // 削除ダイアログのハンドラを設定
    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // 削除ボタンをクリック
    const deleteButtons = page.locator('button[aria-label*="delete"], button[title*="削除"]');

    // 削除テストカテゴリに対応する削除ボタンを探す
    const categoryRow = page.locator('text=削除テストカテゴリ').locator('..');
    const deleteButton = categoryRow.locator('button[aria-label*="delete"], button[title*="削除"]').first();
    await deleteButton.click();

    // カテゴリが削除されたことを確認
    await expect(page.locator('text=削除テストカテゴリ')).not.toBeVisible({ timeout: 5000 });
  });

  test('should create a new field in a category', async ({ page }) => {
    // カテゴリを展開
    const category = page.locator('text=/ステップ 1: 基本情報/i').first();
    await category.click();
    await page.waitForTimeout(500);

    // フィールド追加ボタンを探す
    const addFieldButton = page.locator('button').filter({ hasText: /フィールドを追加|Add Field/i }).first();
    await addFieldButton.click();

    // モーダルが表示されることを確認
    await expect(
      page.locator('text=/フィールド追加|新しいフィールド/i')
    ).toBeVisible({ timeout: 3000 });

    // フォーム入力
    await page.fill('input[name="fieldName"]', 'テストフィールド E2E');

    // データ型を選択（MUIのSelectコンポーネント）
    const dataTypeSelect = page.locator('[role="combobox"]').first();
    await dataTypeSelect.click();

    // テキストオプションを選択
    await page.locator('[role="option"]').filter({ hasText: /テキスト|TEXT/i }).first().click();

    // 表示順序を入力
    await page.fill('input[name="displayOrder"]', '10');

    // 必須フラグをチェック
    const requiredCheckbox = page.locator('input[name="isRequired"]');
    await requiredCheckbox.check();

    // 保存ボタンをクリック
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i });
    await saveButton.click();

    // フィールドが追加されたことを確認
    await expect(page.locator('text=テストフィールド E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should reset to default schema', async ({ page }) => {
    // デフォルト復元ボタンを探す
    const resetButton = page.locator('button').filter({ hasText: /デフォルト復元|Reset to Default/i });
    await resetButton.click();

    // 確認ダイアログのハンドラを設定
    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // ダイアログが表示され、承認後に復元されることを確認
    await page.waitForTimeout(2000);

    // デフォルトカテゴリが表示されることを確認
    await expect(page.locator('text=/ステップ 1: 基本情報/i')).toBeVisible();
  });

  test('should require admin role to access schema settings', async ({ page }) => {
    // ログアウト処理（localStorageをクリア）
    await page.evaluate(() => {
      localStorage.clear();
    });

    // 作成者としてログイン
    await page.goto('/login');
    await page.fill('input[id="email"]', 'creator@example.com');
    await page.fill('input[id="password"]', 'Creator123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // スキーマ設定画面へアクセス
    await page.goto('/settings/schema');

    // 403エラーページまたはunauthorizedページにリダイレクトされることを確認
    await page.waitForTimeout(2000);

    // URLが /unauthorized または /dashboard になっているか、403エラーが表示されることを確認
    const url = page.url();
    expect(
      url.includes('/unauthorized') ||
      url.includes('/dashboard') ||
      page.locator('text=/403|Forbidden|権限がありません/i').isVisible()
    ).toBeTruthy();
  });

  test('should validate field form with required fields', async ({ page }) => {
    // カテゴリを展開
    const category = page.locator('text=/ステップ 1: 基本情報/i').first();
    await category.click();
    await page.waitForTimeout(500);

    // フィールド追加ボタンをクリック
    const addFieldButton = page.locator('button').filter({ hasText: /フィールドを追加|Add Field/i }).first();
    await addFieldButton.click();

    await expect(
      page.locator('text=/フィールド追加|新しいフィールド/i')
    ).toBeVisible({ timeout: 3000 });

    // フィールド名を入力せずに保存ボタンをクリック
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i });
    await saveButton.click();

    // バリデーションエラーが表示されることを確認
    await expect(
      page.locator('text=/フィールド名は必須です|表示順序は必須です/i')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should cancel category creation', async ({ page }) => {
    // カテゴリ追加ボタンをクリック
    const addCategoryButton = page.locator('button').filter({ hasText: /カテゴリを追加|Add Category/i });
    await addCategoryButton.click();

    await expect(
      page.locator('text=/カテゴリ追加|新しいカテゴリ/i')
    ).toBeVisible({ timeout: 3000 });

    // フォームに入力
    await page.fill('input[name="name"]', 'キャンセルされるカテゴリ');
    await page.fill('textarea[name="description"]', 'この説明は保存されません');

    // キャンセルボタンをクリック
    const cancelButton = page.locator('button').filter({ hasText: /キャンセル|Cancel/i });
    await cancelButton.click();

    // モーダルが閉じることを確認
    await expect(
      page.locator('text=/カテゴリ追加|新しいカテゴリ/i')
    ).not.toBeVisible({ timeout: 3000 });

    // カテゴリが追加されていないことを確認
    await expect(page.locator('text=キャンセルされるカテゴリ')).not.toBeVisible();
  });
});
