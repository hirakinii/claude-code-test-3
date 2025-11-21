-- E2Eテストで作成されたデータをクリーンアップするSQLスクリプト

-- 1. 「テストカテゴリ E2E」を削除（カスケード削除により関連フィールドも削除される）
DELETE FROM "Schema_Category"
WHERE name LIKE '%テストカテゴリ E2E%';

-- 2. 「テストフィールド E2E」を削除
DELETE FROM "Schema_Field"
WHERE field_name LIKE '%テストフィールド E2E%';

-- 3. 「ステップ 1: 基本情報」の説明を元に戻す
UPDATE "Schema_Category"
SET description = '仕様書の基本的な情報を入力してください'
WHERE name = 'ステップ 1: 基本情報'
  AND schema_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 確認クエリ: カテゴリ数が6個であることを確認
SELECT COUNT(*) as category_count
FROM "Schema_Category"
WHERE schema_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 確認クエリ: カテゴリ一覧を表示
SELECT name, description, display_order
FROM "Schema_Category"
WHERE schema_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY display_order;
