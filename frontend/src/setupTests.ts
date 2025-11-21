/**
 * setupTests.ts
 * テスト環境のセットアップ
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// グローバルモック
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// window.alert のモック
global.alert = vi.fn();

// window.confirm のモック
global.confirm = vi.fn(() => true);
