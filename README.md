# Pick & Return · 物品借还管理系统

> 一个记录「谁借了我什么、我借了谁什么」的全栈 Web 应用，带完整的归还确认流程、逾期提醒与双语界面。

🌐 **在线体验**：[https://pnr.windfcy.fun](https://pnr.windfcy.fun) — 点首页「体验演示账号」一键登录（`demo` / `demo123`），无需注册。

<!-- 建议在此处放一张桌面 + 移动端并排的应用截图 -->

---

## 项目背景

本项目最初是一个课程作业（内存存储、无密码、无部署），后被重构升级为一个**可上线运行的个人作品集项目**：引入真实数据库与认证、补齐借还业务闭环、完成移动端适配，并部署到云服务器供公开访问。完整的技术决策记录见 [`.claude/decisions.md`](./.claude/decisions.md)，领域术语表见 [`CONTEXT.md`](./CONTEXT.md)。

## 核心功能

- **借还全流程**：出借方登记物品 → 借阅方「我已归还」→ 出借方「确认收到」，采用 `pending → requested → confirmed` 三态机，双方视角分离。
- **逾期与提醒**：自动标记逾期物品；出借方可手动提醒（带冷却），午夜任务扫描逾期项推送通知。
- **归还期限协商**：借阅方可在限定次数内修改应还日期，出借方可设置修改次数上限。
- **通知中心**：请求归还 / 确认归还 / 逾期提醒 / 日期变更四类通知，7 天留存。
- **移动端适配**：响应式布局 + 移动端底部 TabBar，可「添加到主屏」（PWA manifest）。
- **中英双语**：界面语言可切换，偏好持久化。
- **演示账号**：招聘方免注册一键体验预置的各状态示例数据。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 · React Router 6 · Vite · 原生 CSS（BEM） |
| 后端 | Node.js · Express 5 · Prisma 6（ORM） |
| 数据库 | PostgreSQL 16 |
| 认证 | DB-backed Session · bcrypt · HttpOnly/Secure Cookie |
| 安全 | Helmet · express-rate-limit · CSP · Dependabot |
| 日志 | Pino（结构化日志，敏感字段脱敏） |
| 测试 | Vitest · Supertest（58 个集成测试） |
| 部署 | 阿里云 ECS · Nginx · PM2 · Let's Encrypt (HTTPS) |

## 架构

```
用户浏览器
    │ HTTPS
[Nginx]
    ├── /        → 前端静态文件（Vite 构建产物）
    └── /api/*   → 127.0.0.1:3001（Express + Prisma）
                        │
                  [PostgreSQL 16]
```

- **Controller 层**只处理请求/响应，业务逻辑归入 `server/services/`（如归还流程、逾期扫描）。
- **单行 Item 模型**：一条借还记录通过 `lenderId` / `borrowerId` 关联双方，避免数据冗余。
- **多表写操作**（状态流转 + 通知）用 `prisma.$transaction` 保证原子性。

## 工程实践亮点

- **测试驱动的业务保障**：58 个集成测试覆盖认证、权限、三态流转、并发竞态、越权防护。
- **对抗式代码审查**：关键模块（归还流程、认证授权、整体安全）经过独立视角的对抗审查，修复了并发竞态导致的重复通知、登录时序侧信道、会话令牌日志泄露、反向代理下限流退化为全站单桶等真实问题。
- **端到端浏览器验证**：前端改动通过真实浏览器驱动（桌面 + 移动视口）验证，捕获了构建/单测无法发现的 SPA 深链路由、无障碍树等问题。
- **决策留档**：技术选型、领域建模、部署方案全程记录，可追溯。

## 本地运行

前置：Node 20+、Docker（或本地 PostgreSQL 16）。

```bash
# 1. 启动数据库（Docker）
docker compose up -d

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env        # 按需修改 DATABASE_URL / SESSION_SECRET

# 4. 建表 + 灌示例数据
npx prisma migrate dev
npx prisma db seed

# 5a. 开发模式
npm start                   # 后端 Express :3001
npm run dev                 # 前端 Vite :5173，/api 代理到 :3001

# 5b. 或生产模式（Express 托管构建产物）
npm run build && npm start  # 访问 http://localhost:3001
```

其他命令：`npm run lint` · `npm test`（Vitest 监听）· `npm run test:run`（单次跑）。

## API 概览

RESTful JSON API，前缀 `/api/v1`。需认证的路由通过 sid cookie 校验。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/users` | 注册 |
| POST / GET / DELETE / PATCH | `/session` | 登录 / 查会话 / 登出 / 改语言 |
| GET / POST | `/items` | 列出 / 新增借出记录 |
| POST | `/items/:id/request-return` | 借阅方请求归还 |
| POST | `/items/:id/confirm-return` | 出借方确认收到 |
| POST | `/items/:id/remind` | 出借方提醒 |
| PUT / DELETE | `/items/:id` | 编辑 / 删除 |
| PATCH | `/items/:id/duedate` · `/items/:id/modifylimit` | 改期 / 设改期上限 |
| GET / PATCH / DELETE | `/notifications` | 通知列表 / 全部已读 / 删除 |
| GET | `/healthz` | 健康检查 |

## 部署

生产部署方案与手册见 [`deploy/DEPLOY.md`](./deploy/DEPLOY.md)，含 Nginx 配置、PM2 进程管理、SSL 申请、每日数据库备份等。

## 素材授权

界面图标下载自 [Google Material Icons](http://fonts.google.com/icons)，遵循 [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE)。

---

作者：[Wind-FanCY](https://github.com/Wind-FanCY) · 备案号 豫ICP备2026032349号-1
