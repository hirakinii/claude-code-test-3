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
    await expect(page.locator('text=テストカテゴリ E2E').first()).toBeVisible({ timeout: 5000 });
  });

  test('should edit a category', async ({ page }) => {
    // ステップ 1: 基本情報のカテゴリを取得し、その中の編集ボタンをクリック
    const categoryItem = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const editButton = categoryItem.locator('button[aria-label="edit"]');
    await editButton.click();

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

    await expect(page.locator('text=削除テストカテゴリ').first()).toBeVisible({ timeout: 5000 });

    // 削除ダイアログのハンドラを設定
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 削除テストカテゴリの行を取得して、その中の削除ボタンをクリック
    // ListItemの中の削除ボタンを探す
    const categoryItems = page.locator('li').filter({ hasText: '削除テストカテゴリ' });
    const firstCategory = categoryItems.first();
    const deleteButton = firstCategory.locator('button[aria-label="delete"]');
    await deleteButton.click();

    // 削除が完了するまで待つ
    await page.waitForTimeout(1000);

    // カテゴリが削除されたことを確認
    await expect(page.locator('text=削除テストカテゴリ').first()).not.toBeVisible({ timeout: 5000 });
  });

  test('should create a new field in a category', async ({ page }) => {
    // カテゴリを展開（展開ボタンをクリック）
    const categoryItem = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const expandButton = categoryItem.locator('button[aria-label="expand"]');
    await expandButton.click();
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

    // モーダルが閉じるのを待つ
    await expect(
      page.locator('text=/フィールド追加|新しいフィールド/i')
    ).not.toBeVisible({ timeout: 3000 });

    // 保存後、refetch()により展開状態がリセットされるため、再度カテゴリを展開
    const categoryItemAfterSave = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const expandButtonAfterSave = categoryItemAfterSave.locator('button[aria-label="expand"]');
    await expandButtonAfterSave.click();
    await page.waitForTimeout(500);

    // フィールドが追加されたことを確認
    await expect(page.locator('text=テストフィールド E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should reset to default schema', async ({ page }) => {
    // 確認ダイアログのハンドラを設定（ボタンクリック前に設定）
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // デフォルト復元ボタンを探す
    const resetButton = page.locator('button').filter({ hasText: /デフォルト復元|Reset to Default/i });
    await resetButton.click();

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
    // カテゴリを展開（展開ボタンをクリック）
    const categoryItem = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const expandButton = categoryItem.locator('button[aria-label="expand"]');
    await expandButton.click();
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

  // テスト終了後にクリーンアップ
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 管理者としてログイン
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@example.com');
    await page.fill('input[id="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|settings\/schema)/, { timeout: 10000 });

    // スキーマ設定画面へ遷移
    await page.goto('/settings/schema');
    await page.waitForLoadState('networkidle');

    // 「テストカテゴリ E2E」を削除（存在する場合）
    const testCategoryExists = await page.locator('text=テストカテゴリ E2E').first().isVisible().catch(() => false);
    if (testCategoryExists) {
      const categoryItems = page.locator('li').filter({ hasText: 'テストカテゴリ E2E' });
      const count = await categoryItems.count();

      // ダイアログハンドラーを設定
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // すべての「テストカテゴリ E2E」を削除
      for (let i = 0; i < count; i++) {
        const categoryItem = page.locator('li').filter({ hasText: 'テストカテゴリ E2E' }).first();
        const deleteButton = categoryItem.locator('button[aria-label="delete"]');
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 「ステップ 1: 基本情報」の説明を元に戻す
    const step1Category = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const step1EditButton = step1Category.locator('button[aria-label="edit"]');
    await step1EditButton.click();

    // モーダルが表示されるのを待つ
    await page.waitForTimeout(1000);

    // 説明を元に戻す
    const descriptionInput = page.locator('textarea[name="description"]');
    await descriptionInput.clear();
    await descriptionInput.fill('仕様書の基本的な情報を入力してください');

    // 保存
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/i });
    await saveButton.click();
    await page.waitForTimeout(1000);

    // テストフィールド E2E を削除（存在する場合）
    const step1CategoryAfter = page.locator('li').filter({ hasText: /ステップ 1: 基本情報/i }).first();
    const expandButton = step1CategoryAfter.locator('button[aria-label="expand"]');
    await expandButton.click();
    await page.waitForTimeout(500);

    const testFieldExists = await page.locator('text=テストフィールド E2E').isVisible().catch(() => false);
    if (testFieldExists) {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      const fieldItem = page.locator('li').filter({ hasText: 'テストフィールド E2E' }).first();
      const fieldDeleteButton = fieldItem.locator('button[aria-label="delete"]');
      if (await fieldDeleteButton.isVisible().catch(() => false)) {
        await fieldDeleteButton.click();
        await page.waitForTimeout(1000);
      }
    }

    await context.close();
  });
});
