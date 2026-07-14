import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// 测试专用环境变量（指向 pnr_test 库）。在 config 顶层加载，确保 fork 出的 worker 继承。
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // 所有测试共用一个测试库，串行执行避免相互踩踏
    fileParallelism: false,
    setupFiles: ['./tests/setup.js'],
  },
});
