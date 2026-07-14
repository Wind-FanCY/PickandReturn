# PickandReturn 领域词表（CONTEXT）

> 本文档是**术语词表**，不是实现规范。
> 目的：让所有开发者（人 + AI subagent）对同一个词有相同的理解，避免"你说的归还是我理解的归还吗？"这类歧义。
> 实现细节请见 `.claude/decisions.md`（技术栈决策）和 `CLAUDE.md`（架构规范）。

---

## 归还（Return）——三层含义已区分

「归还」是一个抽象概念，指"物品回到出借方"这个过程。系统中**不允许**用"已归还"这种模糊的说法，必须落到下列精确术语之一。

### 状态术语（对应 `returnStatus` 字段）

| 中文标签 | 英文/字段值 | 含义 |
|---------|-------------|------|
| 待归还 | `pending` | 初始状态。借阅方尚未在系统里声明归还 |
| 待确认 | `requested` | 借阅方已声明"我已归还"，但出借方尚未确认收到 |
| 已完成 | `confirmed` | 出借方已确认收到，一次借还生命周期结束 |

### 动作术语

| 中文 | 英文 | 触发者 | 状态转移 | 副作用 |
|------|------|--------|---------|--------|
| 归还请求 | Return Request | 借阅方 | `pending → requested` | 生成 `return_requested` 通知发给出借方 |
| 归还确认 | Return Confirmation | 出借方 | `requested → confirmed` | 生成 `return_confirmed` 通知发给借阅方 |

### 使用约定

- **禁止**在代码、UI、文档里使用"已归还"（`returned`）这种模糊词
- **数据库字段**用 `returnStatus`，不用 `returned` 布尔
- **UI 按钮**：借阅方点的按钮叫"**我已归还**"（触发归还请求），出借方点的按钮叫"**确认收到**"（触发归还确认）
- **API 端点**：`POST /api/v1/items/:id/request-return` 和 `POST /api/v1/items/:id/confirm-return`
- **归档规则**：只有 `confirmed` 状态的物品算"已完成一次借还生命周期"，可以从活跃列表归档到"历史记录"

### 已明确的边界情形

- **借阅方能不能反悔？**（`requested → pending`）v1 MVP **不允许**。将来若引入"驳回"分支再考虑。
- **借阅方列表在 `requested` 状态时显示物品吗？** 显示，状态标签为"待确认"，操作按钮禁用。
- **统计数据里 `requested` 算不算"归还完成"？** **不算**。只有 `confirmed` 算完成。

---

## 物品（Item）——是"记录"，不是"东西"

**Item** 指**一次借出交易的记录**（lending record），不是物理物品本身。

### 定义要点

- 同一本书 A 借给 B（confirmed 归还后），再借给 C，会产生 **2 条 Item**
- Item 有生命周期（三态 `pending → requested → confirmed`），是**事件性数据**，不是**静态实体**
- 中文语境中可称"借出记录"或"物品记录"；代码、API、字段名统一使用 `Item` / `items`

### 常见问题

- **`confirmed` 状态的 Item 还叫 Item 吗？** 是。它只是进入了"历史阶段"，不改变类型。UI 上归档到"历史记录"折叠区。
- **能删除 Item 吗？**
  - 出借方在 `pending` 或 `requested` 前**可以**撤销这次借出（"我改主意不借了"）
  - **已 `confirmed` 的 Item 不允许删除**（保留借还历史完整性）
  - 借阅方**任何状态**都不能删除 Item（防止赖账）

---

## 借阅方 / 出借方（Borrower / Lender）——是"角色"，不是"用户类型"

`Lender` 和 `Borrower` 是**每条 Item 上的两个角色 slot**，不是用户分类。

### 定义要点

- 一个 `User` 可以在 Item A 上是 `Lender`，在 Item B 上是 `Borrower`
- **不存在**"lender 用户"或"borrower 用户"这种分类
- 每条 Item **恰好**有 1 个 lender 和 1 个 borrower

### 硬性规则

| 规则 | 说明 |
|------|------|
| 不能借给自己 | `lenderId ≠ borrowerId`；前端 borrower 输入需校验不等于当前登录用户 |
| Borrower 必须是已注册 User | POST `/items` 时校验 borrower username 存在；否则返回 400 |
| Lender / Borrower 中途不可更换 | 若发生"转借"（B 借来后再借给 C），由 B 作为 lender 新建一条 Item 表达，与原 Item 无关联 |
| 一条 Item 只涉及 1 借 1 还 | 不支持"一次借给多人"或"一次借出多物品"，拆成多条 Item |

---

## 逾期（Overdue）——精确定义

**定义**：`today > backDate && returnStatus !== 'confirmed'`

即：**已过应还日期，且这次借还尚未走到 `confirmed`（无论 `pending` 还是 `requested` 都算逾期）**。

### 关键决策

- **`requested` 状态过期也算逾期**：防止借阅方靠"我已归还但对方没确认"钻空子摆脱逾期标签
- **`confirmed` 状态永远不算逾期**：即便当初拖到了 backDate 之后才 confirmed，历史记录里也不再挂逾期标签
- **同一天多次访问不重复提醒**：`lastAutoReminderDate` 字段用于防止重复触发

### 衍生行为

- **逾期 UI**：红色边框 + "已逾期 X 天"标签，双方视图都显示
- **自动提醒**：每天午夜任务扫描所有 `today > backDate && returnStatus !== 'confirmed'` 的 Item，向借阅方推送提醒
- **统计维度**：逾期 Item 数 = 上述条件的 Item 计数

---

## 通知（Notification）

一条通知是**送达给某个 User 的事件记录**，存储在 `notifications` 表。

### 保留策略

- **创建时间起 7 天自动清理**，无论是否已读
- 定时任务（每日凌晨）删除 `createdAt < now - 7d` 的记录
- 用户 7 天未登录看通知，视为错过

### 通知类型（`Notification.type` 值域）

| 值 | 触发场景 | 接收者 |
|----|---------|--------|
| `return_reminder` | 出借方主动提醒 / 逾期自动提醒 | 借阅方 |
| `date_modified` | 借阅方修改了应还日期 | 出借方 |
| `return_requested` | 借阅方触发归还请求 | 出借方 |
| `return_confirmed` | 出借方触发归还确认 | 借阅方 |

### 追加而非合并

同一 Item 连续多天触发同类通知 → **每次都追加新记录**，不合并、不更新时间戳。理由：简单、可追溯、天然按时间排序。

---

## 修改次数（Modify Limit）

指出借方允许借阅方**修改应还日期**（`Item.backDate`）的次数上限。

### 字段语义

- `modifyLimit`（`Int`）：允许修改的次数上限
- `modifyRemaining`（`Int`）：剩余可修改次数
- **`modifyLimit === -1` 表示不限次数**（魔数，需在代码里定义常量 `MODIFY_UNLIMITED = -1` 提升可读性）

### 规则

- 借阅方调用 `PATCH /items/:id/duedate` 修改日期时：
  - `modifyRemaining > 0` 或 `modifyLimit === -1` → 允许
  - 允许后 `modifyRemaining--`（`-1` 不递减）
  - 触发 `date_modified` 通知给出借方
- 出借方可通过 `PATCH /items/:id/modifylimit` 调整 `modifyLimit`，同时同步调整 `modifyRemaining`（重新计算剩余）

---

## 历史记录（History）

**定义**：状态为 `confirmed` 的 Item 归档到"历史记录"折叠区。

### UI 表现

- 活跃列表默认只显示 `pending` 和 `requested` 状态的 Item
- 页面底部有"查看历史（N）"入口，展开显示 `confirmed` 记录
- 借阅方和出借方视图均采用此设计
- 历史记录**只读**（无操作按钮）

### 数据侧

- 不用单独的表或字段，通过 `returnStatus === 'confirmed'` 即可筛选
- 排序按 `confirmedAt` 降序

---

## Demo 账号（Demo Account）

用于招聘方无需注册即可体验完整功能的**共享账号**。

### 属性

- 用户名 `demo`（保留字，其他人不能注册）
- 密码 `demo123`（明码在 seed 脚本 + 登录页 "Try Demo" 按钮中公开）
- **是普通 User**，具备完整功能：登录、创建 Item、请求归还、修改期限等
- 由 `prisma/seed.js` 预置数据，覆盖各状态

### 特殊规则

- **保留用户名**：POST `/users` 请求 `username === 'demo'`（不区分大小写）返回错误
- **不能被作为 borrower**：POST `/items` 请求 `borrower === 'demo'` 返回错误（防止有人把 demo 当垃圾桶）
- **可选定时重置**（v1 不实现）：每日凌晨用 seed 脚本重置数据，防止招聘方之间互相踩踏
