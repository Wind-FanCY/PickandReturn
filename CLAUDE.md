# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **重要**：项目已从"课程作业"升级为"个人作品集项目"。
> 完整决策记录见 [`.claude/decisions.md`](./.claude/decisions.md)——**是本文档的权威版本**，任何冲突以 decisions.md 为准。
> 开发前请先阅读 decisions.md 了解升级后的技术栈和约束变化。

## 常用命令

```bash
npm install                       # 安装依赖
npm run build                     # Vite 构建前端，输出到 dist/
npm start                         # 启动 Express 服务器（生产模式）
npm run dev                       # 前端开发服务器（/api/v1 代理到 :3001）
npm run lint                      # ESLint 检查
npm test                          # 跑 vitest 集成测试

# Prisma 相关
npx prisma migrate dev --name xxx # 本地开发时生成并应用迁移
npx prisma migrate deploy         # 生产环境应用迁移（CI/CD 用）
npx prisma studio                 # 打开数据库可视化管理界面
npx prisma db seed                # 跑 seed 脚本（写 demo 账号 + 示例数据）
```

**重要**：`npm start` 运行的是 `node server.js`。生产端口是 `3001`（旧版本占用 3000，蓝绿部署期间并存）。

## 项目架构

### 请求流向（生产环境）

```
用户浏览器
    ↓ HTTPS (443)
[Nginx]
    ├── / → 前端静态文件 (Vite build 产物)
    └── /api/* → http://127.0.0.1:3001 (Node)
                          ↓
                    [Express + Prisma]
                          ↓
                    [PostgreSQL 16]
```

### 后端分层

| 文件 | 职责 |
|------|------|
| `server.js` | Express 入口，中间件挂载 + 路由注册 |
| `server/controllers/session-controller.js` | 会话路由（login / logout / getSession） |
| `server/controllers/item-controller.js` | 物品路由（CRUD + sendNotice + 归还流程） |
| `server/controllers/user-controller.js` | 用户注册路由 |
| `server/controllers/notification-controller.js` | 通知路由 |
| `server/services/` | 复杂业务逻辑（如 `return-flow.js`、`reminder.js`） |
| `prisma/schema.prisma` | 数据库 schema（四张表：User/Session/Item/Notification） |
| `lib/prisma.js` | 单例 PrismaClient 导出 |
| `lib/logger.js` | pino 日志实例 |

**架构原则**：
- Controller 只做请求/响应处理，不写业务逻辑
- 数据操作全部通过 `lib/prisma.js` 单例调 `prisma.xxx.yyy()`——**已移除 `server/models/*` 内存数据层**
- 复杂业务逻辑放到 `server/services/` 目录（如 `server/services/return-flow.js`）

### 前端结构（`src/`）

- **`App.jsx`** — 根组件，`<BrowserRouter>` + `<Routes>`，挂载时执行 `fetchSession`
- **`app-context.js`** — 导出 `AppContext`，通过 Provider 向下传递 `[state, dispatch]`
- **`reducer.js`** — 唯一全局 reducer；**不再包含 `pageStatus`**（URL 就是页面状态）
- **`constant.js`** — 所有字符串常量：`LOGIN_STATUS`、`ACTIONS`、`SERVER` 错误码、`MESSAGES`、`FORM_MODE`
- **`services.js`** — 所有 `fetch()` 调用封装，**用 `async/await`**
- **`components/ProtectedRoute.jsx`** — 需登录路由的守卫组件

### 前端路由（react-router-dom v6）

| 路径 | 页面 | 需登录 |
|------|------|--------|
| `/` | 根路径 | 已登录跳 `/items`，未登录跳 `/login` |
| `/login` | 登录页 | 否 |
| `/register` | 注册页 | 否 |
| `/items` | 出借列表页 | 是 |
| `/return` | 借入列表页 | 是 |
| `/notifications` | 通知列表页 | 是 |
| `*` | 404 页 | - |

### 全局 State 结构（升级后）

```js
{
  loginStatus: 'pending' | 'notLoggedIn' | 'loggedIn',
  username: '',
  items: {},           // 以 id 为键；同时包含出借和借阅两类物品
  notifications: [],
  isItemsPending: false,
  lastAddedItemId: '',
  error: '',
  success: ''
}
```

> **注意**：`pageStatus` 已从全局 state 中移除。页面状态由 URL 决定。

### Items 数据模型

- 一条 Item 在数据库中只存一份，通过 `lenderId` 和 `borrowerId` 关联到两个用户
- 前端 `Item.jsx` 通过 `item.lender.username === state.username` 判断出借方/借阅方视图
- 归还流程使用 `returnStatus` 三态字段：`pending | requested | confirmed`
  - 借阅方点"我已归还" → `pending → requested`，通知出借方
  - 出借方点"确认收到" → `requested → confirmed`，通知借阅方

## 项目约束（升级后）

### 已解除的原课程禁令

- `async/await` **允许使用**（前后端全面采用）
- `react-router-dom@6` **允许使用**
- `localStorage` **允许使用**（缓存语言偏好、最后登录用户名等非敏感数据）

### 仍保留的约束

- **不用 `alert` / `confirm` / `prompt`**（用自定义弹窗组件）
- **不用 CSS-in-JS、CSS Modules、styled-components**
- **不用 `style` 属性/prop**（内联样式）
- **不用 Bootstrap、jQuery、font-awesome、axios**
- CSS class 使用 kebab-case 或 BEM
- 不用浮动布局（`float` 只用于图文混排）
- 不用 `<table>` 做非表格布局
- HTML 用语义化元素
- 需触发操作的元素用 `<button>`，不用 `<a>` 模拟按钮
- 不在 React 外部操作 DOM
- 后端所有请求/响应必须是 JSON

## 认证与授权（升级后）

- **注册**：`POST /api/v1/users`（无需认证）
  - 请求体：`{ username, password }`
  - 用户名格式：`/^[a-zA-Z0-9_]+$/`
  - 密码用 `bcrypt.hash(password, 10)` 存到 `password_hash` 字段
- **登录**：`POST /api/v1/session`
  - 请求体：`{ username, password }`
  - `bcrypt.compare(password, user.passwordHash)`
  - 通过后生成 Session（存 DB）+ 设置 sid cookie
- **Session cookie**：`HttpOnly` + `Secure`（生产） + `SameSite=Lax` + `Max-Age=30d`
- **速率限制**：`/api/v1/session` 挂 `express-rate-limit`，15 分钟 10 次上限
- **禁用用户**：`"dog"` 规则保留
- **Demo 账号**：`demo` / `demo123`（首页提供 Try Demo 按钮一键登录）

## API 端点速查（升级后）

| 方法 | 路径 | 需认证 | 说明 |
|------|------|--------|------|
| POST | `/api/v1/users` | 否 | 注册（含密码） |
| GET | `/api/v1/session` | 是 | 检查 session |
| POST | `/api/v1/session` | 否 | 登录（含密码） |
| DELETE | `/api/v1/session` | 是 | 登出 |
| PATCH | `/api/v1/session` | 是 | 更新语言偏好 |
| GET | `/api/v1/items` | 是 | 获取当前用户所有物品 |
| POST | `/api/v1/items` | 是 | 新增出借记录 |
| POST | `/api/v1/items/:id/remind` | 是 | 出借方发送提醒 |
| POST | `/api/v1/items/:id/request-return` | 是 | **借阅方请求归还**（新） |
| POST | `/api/v1/items/:id/confirm-return` | 是 | **出借方确认收到**（新） |
| PUT | `/api/v1/items/:id` | 是 | 编辑物品信息 |
| DELETE | `/api/v1/items/:id` | 是 | 删除物品（仅出借方） |
| PATCH | `/api/v1/items/:id/duedate` | 是 | 修改归还期限（借阅方） |
| PATCH | `/api/v1/items/:id/modifylimit` | 是 | 设置修改限制（出借方） |
| GET | `/api/v1/notifications` | 是 | 获取通知 |
| PATCH | `/api/v1/notifications/read` | 是 | 全部已读 |
| DELETE | `/api/v1/notifications/:id` | 是 | 删除通知 |
| GET | `/api/v1/healthz` | 否 | 健康检查（探活） |

## AI 编码行为规范

> 这些规范偏向谨慎而非速度。对于简单任务可自行判断是否适用。

### 1. 先思考，再编码

- 明确假设，不确定就问
- 若存在多种理解方式，逐一列出
- 有更简单方案就说出来
- 有不清楚的地方，先暂停指出，问完再继续

### 2. 简洁优先

- 不新增超出要求的功能
- 单次使用的代码不做抽象封装
- 不添加"灵活性"或"可配置性"
- 不为不可能发生的场景写错误处理
- 若写了 200 行而 50 行可以解决，重写

自查：「资深工程师会觉得这段代码过度复杂吗？」

### 3. 精准修改

- 只改必须改的地方
- 不"顺手优化"相邻代码
- 保持与已有代码风格一致
- 只清理**因自己改动**变得无用的代码，不删改动前就存在的死代码

判断标准：每一处改动都应能直接追溯到用户的请求。

### 4. 目标驱动执行

将任务转化为可验证目标：
- "添加校验" → "为无效输入编写测试，再让测试通过"
- "修复 bug" → "编写能复现 bug 的测试，再让测试通过"
- "重构 X" → "确保重构前后测试均通过"

多步骤任务先说明简要计划：
```
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
```

## 部署简报

- **服务器**：阿里云 ECS（国内节点），IP `47.95.179.176`
- **域名**：`pnr.windfcy.fun`（已备案）
- **进程管理**：PM2（进程名 `pnr`，端口 3001）
- **反向代理**：Nginx（SSL 由 Let's Encrypt 提供）
- **CI/CD**：GitHub Actions（push main 自动部署）
- **备份**：cron + `pg_dump` + 阿里云 OSS，每日凌晨 3 点

完整部署方案见 `.claude/decisions.md` 的"部署架构"章节。
