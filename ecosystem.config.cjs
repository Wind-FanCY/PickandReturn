// PM2 进程配置。进 Git，但不含任何 secret——
// DATABASE_URL / SESSION_SECRET 由同目录下的 .env 提供（.env 不进 Git）。
// 用法：在仓库根目录执行 `pm2 start ecosystem.config.js`
module.exports = {
  apps: [
    {
      name: 'pnr',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      // 2 核 2G 机器，保守设内存上限，超过自动重启防泄漏拖垮机器
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // server.js 顶部 `import 'dotenv/config'` 会加载 .env 补上 DATABASE_URL / SESSION_SECRET
      // （dotenv 默认不覆盖已存在的 env，所以上面的 NODE_ENV/PORT 仍以 PM2 为准）
      out_file: './logs/pnr-out.log',
      error_file: './logs/pnr-error.log',
      time: true
    }
  ]
};
