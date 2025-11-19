module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント
        'style', // フォーマット
        'refactor', // リファクタリング
        'test', // テスト
        'chore', // その他
        'perf', // パフォーマンス改善
        'ci', // CI/CD
        'build', // ビルド
        'revert', // 巻き戻し
      ],
    ],
    'subject-case': [0], // 日本語対応のため無効化
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
  },
};
