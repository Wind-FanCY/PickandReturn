# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
npm install        # 安装依赖
npm run build      # Vite 构建前端，输出到 dist/
npm start          # 启动 Express 服务器（端口 3000），同时托管静态文件和 REST API
npm run dev        # 仅启动 Vite 开发服务器（/api/v1 代理到 :3000）
npm run lint       # ESLint 检查
```

**重要**：`npm start` 运行的是 `node server.js`，不是 Vite。必须先 `npm run build` 再 `npm start`。提交代码前不要在 `scripts` 中将 `start` 指向 Vite 或 `npm run dev`。

## 项目架构

### 请求流向
```
浏览器 → Express (server.js)
          ├── /api/v1/* → 控制器（Controllers）
          └── /*        → dist/ 静态文件（Vite 构建产物）
```

### 后端分层（根目录 .js 文件）

| 文件 | 职责 |
|------|------|
| `server.js` | Express 入口，只做路由注册 |
| `session-controller.js` | 会话路由处理（login / logout / getSession） |
| `item-controller.js` | 物品路由处理（CRUD + sendNotice） |
| `user-controller.js` | 用户注册路由处理 |
| `sessions.js` | Session 数据模型（内存，`crypto.randomUUID` 生成 sid） |
| `users.js` | 用户数据模型（格式校验、权限校验、注册状态） |
| `items.js` | 物品列表工厂函数，每用户一个闭包实例 |

控制器只做请求/响应处理，不持有状态。所有状态和业务逻辑在 `sessions.js` / `users.js` / `items.js` 中。全部数据存储在内存，服务器重启后清空。

### 前端结构（`src/`）

- **`App.jsx`** — 根组件，持有 `useReducer`，挂载时执行 `fetchSession` 检查登录态
- **`app-context.js`** — 导出 `AppContext`，通过 Provider 向下传递 `[state, dispatch]`
- **`reducer.js`** — 唯一全局 reducer，所有 action 在此处理
- **`constant.js`** — 所有字符串常量的唯一来源：`LOGIN_STATUS`、`PAGE_STATUS`、`ACTIONS`、`SERVER` 错误码、`MESSAGES`、`FORM_MODE`
- **`services.js`** — 所有 `fetch()` 调用的封装，每个 API 端点对应一个导出函数

### 全局 State 结构

```js
{
  loginStatus: 'pending' | 'notLoggedIn' | 'loggedIn',
  pageStatus:  'itemsPage' | 'noticesPage',
  username: '',
  items: {},           // 以 id 为键；同时包含出借和借阅两类物品
  isItemsPending: false,
  lastAddedItemId: '', // 新增物品后高亮用
  error: '',
  success: ''
}
```

### 页面路由（无 react-router）

`App.jsx` 根据 `loginStatus` 条件渲染三种状态：Loading / LoginForm / MainContent。`MainContent.jsx` 根据 `pageStatus` 渲染 `ItemsPage` 或 `NoticesPage`。`Nav.jsx` 通过 dispatch `checkItems` / `checkNotices` 切换页面。页面刷新不保留前端状态，这是课程的已知限制。

### Items 数据模型的特殊设计

每个用户的 `itemsList` 是 `items.makeItemsList()` 创建的独立闭包实例。`sendNotice` 操作会将同一条物品信息写入借阅人的 `itemsList`，因此同一物品可同时出现在出借方和借阅方的列表中。`Item.jsx` 通过 `item.lender === state.username` 判断渲染出借方视图还是借阅方视图。

## 课程硬性约束（违反会直接失分）

### 绝对禁止
- **不能使用 `async` / `await`**：所有异步代码必须用 `.then()` / `.catch()` Promise 链
- **不能使用以下库**：`react-router`、`@tanstack/router`、`axios`、`Bootstrap`、`jQuery`、`express-session`、`SASS/Less`、CSS 预处理器、`font-awesome`
- **不能使用 `alert` / `confirm` / `prompt`**
- **不能使用 `localStorage` / `sessionStorage` / `IndexedDB`**，只允许 `sid` cookie
- **不能在 React 外部用 JS 操作 DOM**
- **不能使用 `style` 属性/prop**（内联样式）
- **不能使用 CSS-in-JS、CSS Modules、styled-components**

### CSS 规范
- CSS 必须写在独立的 `.css` 文件中
- class 名使用 kebab-case 或 BEM
- 不用浮动布局（float 只用于图文混排）
- 不用 HTML table 做非表格数据的布局

### HTML 规范
- 使用语义化 HTML 元素（`<nav>`、`<header>`、`<main>`、`<button>` 等）
- 需要触发操作的元素用 `<button>`，不用 `<a>` 模拟按钮

### 后端规范
- 所有服务响应必须是 JSON；所有请求体必须是 JSON
- 后端必须对用户输入进行验证/清理（不需要 HTML 转义，React 自动处理）
- 允许的后端库：`express`、`cookie-parser`

### 不应提交的文件
- `node_modules/`、`dist/`、IDE 配置文件

## 认证与授权

- **注册**：`POST /api/v1/users`（无需认证），首次使用必须先注册
- **登录**：`POST /api/v1/session`（无密码，仅验证用户名是否已注册）
- **Session**：登录后服务端设置 `sid` cookie，每个受保护的路由均需验证
- **禁用用户**：用户名 `"dog"`（大小写不敏感）永久返回 `403 auth-insufficient`，与格式错误区分处理
- **用户名格式**：`/^[a-zA-Z0-9_]+$/`

## API 端点速查

| 方法 | 路径 | 需要认证 | 说明 |
|------|------|----------|------|
| POST | `/api/v1/users` | 否 | 注册新用户 |
| GET | `/api/v1/session` | 是 | 检查当前 session |
| POST | `/api/v1/session` | 否 | 登录 |
| DELETE | `/api/v1/session` | 是 | 登出 |
| GET | `/api/v1/items` | 是 | 获取当前用户所有物品 |
| POST | `/api/v1/items` | 是 | 新增出借记录 |
| PATCH | `/api/v1/items/:id` | 是 | 更新归还状态 |
| DELETE | `/api/v1/items/:id` | 是 | 删除物品 |
| POST | `/api/v1/items/:id` | 是 | 向借阅人发送归还提醒 |

## AI 编码行为规范

> 这些规范旨在减少 LLM 常见编码错误，偏向谨慎而非速度。对于简单任务可自行判断是否适用。

### 1. 先思考，再编码

**不要假设，不要隐藏困惑，要主动暴露权衡选项。**

实现之前：
- 明确说明你的假设，若不确定则提问
- 若存在多种理解方式，逐一列出，不要默默选择一种
- 若有更简单的方案，要说出来，必要时推回需求
- 若有不清楚的地方，先停下来，指出困惑点，提问再继续

### 2. 简洁优先

**用最少的代码解决问题，不写投机性代码。**

- 不新增任何超出要求的功能
- 单次使用的代码不做抽象封装
- 不添加未被要求的"灵活性"或"可配置性"
- 不为不可能发生的场景添加错误处理
- 若写了 200 行而 50 行可以解决，重写

自查标准：「资深工程师会觉得这段代码过度复杂吗？」如果是，简化它。

### 3. 精准修改

**只改必须改的地方，只清理自己制造的问题。**

修改已有代码时：
- 不"顺手优化"相邻代码、注释或格式
- 不重构没有问题的代码
- 保持与已有代码风格一致，即使你有更好的写法
- 若发现无关的死代码，提及但不删除

当自己的改动造成孤儿代码时：
- 移除因**自己的改动**而变得无用的 import/变量/函数
- 不删除改动前就已存在的死代码（除非被要求）

判断标准：每一处改动都应能直接追溯到用户的请求。

### 4. 目标驱动执行

**先定义成功标准，循环验证直到达成。**

将任务转化为可验证目标：
- "添加校验" → "为无效输入编写测试，再让测试通过"
- "修复 bug" → "编写能复现 bug 的测试，再让测试通过"
- "重构 X" → "确保重构前后测试均通过"

对于多步骤任务，先说明简要计划：
```
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
3. [步骤] → 验证：[检查项]
```

清晰的成功标准能让 AI 独立循环执行；模糊标准（"让它能跑"）则需要反复确认。
