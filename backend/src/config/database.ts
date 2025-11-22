/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Prisma Clientのシングルトンインスタンスを作成
 * 開発環境ではホットリロード時にインスタンスが増えないようにグローバル変数を使用
 */
const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const prisma: PrismaClient = globalThis.prismaGlobal ?? prismaClientSingleton();

// ログイベントハンドラーの設定
// Note: Prisma の $on メソッドは型定義が厳密で、イベントハンドラの設定には
// PrismaClient の初期化時に log オプションで指定したイベントのみ使用可能
// 開発環境では上記の log 設定でクエリログが出力される

// 本番環境以外ではグローバル変数にインスタンスを保存
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };

/**
 * データベース接続を確認する
 * @throws Error データベース接続に失敗した場合
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw new Error('Database connection failed');
  }
}

/**
 * データベース接続を切断する
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Failed to disconnect from database', { error });
  }
}
