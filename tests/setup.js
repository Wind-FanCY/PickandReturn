import { beforeEach, afterAll } from 'vitest';
import prisma from '../lib/prisma.js';

// 安全阀：绝不在非测试环境清库
if (process.env.NODE_ENV !== 'test') {
  throw new Error(`测试初始化拒绝运行：NODE_ENV=${process.env.NODE_ENV}（必须为 test）`);
}

// 每个用例前清空所有表，保证隔离。CASCADE 处理外键依赖。
beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE notifications, items, sessions, users RESTART IDENTITY CASCADE'
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
