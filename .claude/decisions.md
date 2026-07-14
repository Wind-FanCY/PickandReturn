# PickandReturn 项目决策记录（Decisions）

> 这份文档是项目升级的**权威决策文档**（single source of truth）。
> CLAUDE.md、所有 subagent 定义、开发过程中的每一次实现，都以此为准。
> 决策未变更前，任何 agent 不得偏离此处的约定。

**记录时间**：2026-07-10
**当前项目状态**：从"课程作业"升级为"个人作品集项目"，准备部署到 `pnr.windfcy.fun` 供招聘方访问。

---

## 一、项目定位

**目标**：**个人作品集项目**（B 级定位）
- 挂在简历上，招聘方可试用
- 不追求 7×24 高可用，不做多环境、SEO、合规
- 加真实密码、真实域名、简单监控即可

---

## 二、被解除的课程约束

以下 3 项**课程原始禁令已解除**，作品集版本可以自由使用：

| 原禁令 | 新态度 | 用途 |
|--------|-------|------|
| `async/await` | **允许使用** | 后端 controller、前端 services.js 全面改用 async/await |
| `react-router` | **允许使用** | 前端引入 `react-router-dom@6`，实现真实 URL 路由 |
| `localStorage` | **允许使用** | 缓存语言偏好、最后登录用户名等非敏感数据 |

---

## 三、仍保留的约束

以下课程约束**继续遵守**（这些是工程 best-practice，不是应试要求）：

- 不用 `alert` / `confirm` / `prompt`（改用自定义弹窗组件）
- 不用 CSS-in-JS / CSS Modules / styled-components（保留独立 `.css` 文件）
- 不用 `style` 属性/prop（内联样式）
- 不用 Bootstrap / jQuery / font-awesome
- CSS class 使用 kebab-case 或 BEM
- 不用浮动布局，不用 `<table>` 做非表格布局
- HTML 用语义化元素（`<nav>`、`<header>`、`<main>`、`<button>` 等）
- 不用 `<a>` 模拟按钮
- 后端所有请求/响应必须是 JSON

---

## 四、认证与业务

### 认证模型
- **用户名 + 密码**（无邮箱、无找回）
- 密码用 `bcrypt` 哈希存储（cost=10）
- 首页有 **"Try Demo" 按钮**，一键登录 demo 账号
- 用户名格式仍为 `/^[a-zA-Z0-9_]+$/`
- 禁用用户 `"dog"` 规则保留

### 归还流程（新，替代原单方标记）

**状态机**：`pending → requested → confirmed`

```
[初始 pending]
     ↓  借阅方点"我已归还"
[requested] ──────────► 生成 return_requested 通知 → 出借方
     ↓  出借方点"确认收到"
[confirmed] ──────────► 生成 return_confirmed 通知 → 借阅方
```

**规则**：
- 处于 `requested` 时借阅方不能再点归还
- 出借方 UI 显示"XX 已归还，请确认"+ Confirm 按钮
- 完成 `confirmed` 后双方列表归档到"历史记录"
- 暂不做"驳回"分支（v2 再加）

### Demo 数据
- 移除 `items.js` 里硬编码的 visitor 示例数据
- 新用户注册后列表为空
- Demo 账号（用户名 `demo`，密码 `demo123`）由 seed 脚本预置：
  - 一件未到期的出借物品
  - 一件已逾期的出借物品
  - 一件借入的临近到期物品
  - 一件借入的、已请求归还等确认的物品
  - 一件已完成归还的历史记录
  - 2-3 条未读通知

---

## 五、技术栈

### 数据库
- **PostgreSQL** 16
- 部署：ECS 上 `apt install postgresql-16 postgresql-contrib`
- 本地开发：装本地 Postgres 或用相同的 CLI

### ORM
- **Prisma**（schema-first ORM）
- schema 文件位置：`prisma/schema.prisma`
- 迁移命令：`npx prisma migrate dev --name xxx`
- 生产部署：`npx prisma migrate deploy`
- 客户端：`import { PrismaClient } from '@prisma/client'`

### Prisma Schema（4 张表）

```prisma
model User {
  id            String         @id @default(uuid())
  username      String         @unique
  passwordHash  String         @map("password_hash")
  language      String         @default("zh")
  createdAt     DateTime       @default(now()) @map("created_at")

  lentItems     Item[]         @relation("Lender")
  borrowedItems Item[]         @relation("Borrower")
  notifications Notification[]
  sessions      Session[]

  @@map("users")
}

model Session {
  sid       String   @id
  userId    String   @map("user_id")
  language  String   @default("zh")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Item {
  id                    String    @id @default(uuid())
  itemDetail            String    @map("item_detail")
  lentDate              DateTime  @map("lent_date")  @db.Date
  backDate              DateTime  @map("back_date")  @db.Date
  returnStatus          String    @default("pending") @map("return_status")
    // 值域：pending | requested | confirmed
  returnedAt            DateTime? @map("returned_at")
  confirmedAt           DateTime? @map("confirmed_at")
  modifyLimit           Int       @default(3) @map("modify_limit")
  modifyRemaining       Int       @map("modify_remaining")
  lastAutoReminderDate  DateTime? @map("last_auto_reminder_date") @db.Date

  lenderId              String    @map("lender_id")
  borrowerId            String    @map("borrower_id")
  lender                User      @relation("Lender",   fields: [lenderId],   references: [id])
  borrower              User      @relation("Borrower", fields: [borrowerId], references: [id])

  notifications         Notification[]

  createdAt             DateTime  @default(now()) @map("created_at")

  @@map("items")
}

model Notification {
  id            String   @id @default(uuid())
  type          String
    // 值域：return_reminder | date_modified | return_requested | return_confirmed
  message       String
  read          Boolean  @default(false)
  userId        String   @map("user_id")
  relatedItemId String?  @map("related_item_id")

  user          User     @relation(fields: [userId], references: [id])
  relatedItem   Item?    @relation(fields: [relatedItemId], references: [id], onDelete: SetNull)

  createdAt     DateTime @default(now()) @map("created_at")

  @@map("notifications")
}
```

### Session 存储
- **数据库存 Session**（不用 JWT，不用 Redis）
- Session 有效期：30 天
- 每日定时清理过期 Session
- 登出：`prisma.session.delete()`

### 前端路由
- **`react-router-dom@6`** + `BrowserRouter`
- 路径表：

| 路径 | 页面 | 需登录 |
|------|------|--------|
| `/` | 根路径 | 已登录跳 `/items`，未登录跳 `/login` |
| `/login` | 登录页 | 否 |
| `/register` | 注册页 | 否 |
| `/items` | 出借列表页 | 是 |
| `/return` | 借入列表页 | 是 |
| `/notifications` | 通知列表页 | 是 |
| `*` | 404 页 | - |

- 需登录路由用 `<ProtectedRoute>` 包裹
- reducer 中删除 `pageStatus` state 和相关 action

### 移动端适配
- **响应式改造**（不做移动端专属分支）
- 单一断点：`@media (max-width: 768px)`
- **桌面顶部 Nav + 移动端底部 TabBar**
- 卡片布局：桌面网格，移动纵向单列
- 按钮组：桌面横排，移动折叠到 `<details>` 或长按菜单
- 最小触控区 `44 × 44px`
- 输入框字号 `≥16px`（防止 iOS 缩放）

### PWA
- **仅 manifest.json**（不做 Service Worker）
- `public/manifest.json` + 图标（192、512 尺寸）
- `<link rel="manifest">` 加到 index.html
- 效果：可"添加到主屏幕"，全屏运行

### 日志与监控
- **`pino` 结构化日志** + `pino-http` middleware
- 后端新增健康检查：`GET /api/v1/healthz`（检查 DB 连通性）
- 生产环境用 `pino-pretty` 让 PM2 logs 彩色
- **UptimeRobot** 每 5 分钟 ping `/healthz`，故障邮件告警

### 安全加固
1. **cookie**：`HttpOnly` + `Secure`（仅 production） + `SameSite=Lax` + `Max-Age=30d`
2. **`bcrypt`**：密码哈希 cost=10
3. **`express-rate-limit`**：登录接口 15 分钟内 10 次上限
4. **`helmet`**：全局启用安全响应头
5. **GitHub Dependabot**：开启自动 CVE PR

### 测试
- **vitest + supertest** 集成测试
- 测试目录：`tests/`
- 每次测试前 `prisma migrate reset --force` 重置测试库
- `.env.test` 指向独立测试数据库
- 覆盖场景：
  - 认证流程（注册、登录、登出、bcrypt 校验）
  - 物品 CRUD + 双方列表同步
  - 归还流程（借阅方 request → 出借方 confirm）
  - 权限验证（借阅方不能删物品）
  - 通知生成

### 依赖新增清单

**后端**：
- `@prisma/client`
- `prisma`（devDependency）
- `bcrypt`
- `dotenv`
- `helmet`
- `express-rate-limit`
- `pino` + `pino-http` + `pino-pretty`

**前端**：
- `react-router-dom@6`

**测试**：
- `vitest`
- `supertest`

---

## 六、部署架构

### 拓扑

```
用户浏览器
    ↓ HTTPS (443)
[Nginx]（已安装）
    ├── / → 前端静态文件（/var/www/pickandreturn/）
    └── /api/* → http://127.0.0.1:3001（Node）
                          ↓
                    [Node.js + PM2]
                          ↓
                    [PostgreSQL 16]（本机安装）
```

### 服务器信息
- **IP**：`47.95.179.176`（阿里云 ECS，国内节点）
- **配置**：2 核 2G，40G 磁盘，Ubuntu
- **域名**：`pnr.windfcy.fun`（已备案，指向此项目）
- **主域名**：`windfcy.fun`（未来放个人作品集主站）
- **SSL**：Let's Encrypt（`certbot` 自动申请 + 续期）

### 进程管理
- **PM2**（`npm install -g pm2`）
- 进程名：`pnr`（新版本）、`pnr-legacy`（旧版本，蓝绿部署期间）
- 开机自启：`pm2 startup && pm2 save`
- ecosystem 文件：`ecosystem.config.js`（进 Git，不含 secrets）

### 环境变量
- 生产：`.env`（不进 Git）+ `ecosystem.config.js` 组合
- `.env` 内容：`DATABASE_URL`、`SESSION_SECRET`、`NODE_ENV`、`PORT`
- `.gitignore` 必须包含 `.env`

### 蓝绿部署策略
1. 新版本先跑 `:3001`（保留旧 `:3000`）
2. 手动验证新版本可访问
3. Nginx 反代切到 `:3001`
4. 观察 1-2 天，稳定后 `pm2 delete pnr-legacy`
5. 回滚：仅需 Nginx 切回旧配置

### CI/CD
- **GitHub Actions** workflow：`.github/workflows/deploy.yml`
- 触发：push 到 `main` 分支
- 步骤：checkout → lint → 测试 → SSH 到 ECS → git pull → `prisma migrate deploy` → build → `pm2 reload pnr` → curl 健康检查
- GitHub Secrets：`ECS_HOST`、`ECS_USER`、`ECS_SSH_KEY`

### 数据库备份
- **每日凌晨 3 点** cron 触发
- `pg_dump | gzip | ossutil cp → oss://your-bucket/pnr-backups/`
- 保留 30 天，自动清理

---

## 七、5 阶段执行顺序

| 阶段 | 名称 | 天数 | 交付物 |
|------|------|------|--------|
| A | 数据库地基 | 2-3d | Postgres + Prisma 上线，功能对齐 |
| B | 业务增强 | 2-3d | 归还确认流程 + demo 账号 + seed |
| C | 前端重构 | 3-4d | react-router + 响应式 + PWA manifest |
| D | 测试与安全 | 1-2d | vitest 集成测试 + 五件套安全加固 |
| E | 部署上线 | 3-4d | pnr.windfcy.fun 上线 + CI/CD + 备份 + 监控 |

**总预估**：12-15 天（全职单人）；有并行度可压缩到 10-12 天。

---

## 八、Agent 分工

- **backend agent**：Prisma schema、controller 改造、seed 脚本、健康检查端点、pino 日志、bcrypt 认证、rate-limit、helmet、集成测试
- **frontend agent**：react-router 迁移、reducer 精简、services.js 改 async/await、移动端 CSS 改造、TabBar 组件、manifest.json、localStorage 使用
- **uiux agent**：移动端设计规格、断点方案、TabBar 视觉规格、44×44 触控区、归还确认按钮的视觉状态

**执行时**：主 Claude 负责分派 + 集成 + 决策微调；具体实现交给对应 subagent 完成。

---

## 九、这份文档的使用规则

1. **动手前先读**：任何 subagent 在开工前必须读这份文档
2. **决策变更须回写**：任何超出这里的决策，先来主 Claude 提问，确认后回写此处
3. **CLAUDE.md 是简化视图**：如两份文档冲突，以本文档为准
4. **过时决策要划掉**：不是删除，是画删除线保留历史，方便追溯
