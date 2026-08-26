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
| 归还驳回 | Return Rejection | 出借方 | `requested → pending` | 出借方表示"未收到";生成 `return_rejected` 通知发给借阅方;`backDate` 不变，若已过期借阅方将重新逾期 |

### 使用约定

- **禁止**在代码、UI、文档里使用"已归还"（`returned`）这种模糊词
- **数据库字段**用 `returnStatus`，不用 `returned` 布尔
- **UI 按钮**：借阅方点"**我已归还**"（归还请求）；出借方点"**确认收到**"（归还确认）或"**未收到**"（归还驳回）
- **API 端点**：见 CLAUDE.md API 速查（request-return / confirm-return / reject-return）
- **归档规则**：只有 `confirmed` 状态的物品算"已完成一次借还生命周期"，可以从活跃列表归档到"历史记录"

### 已明确的边界情形

- **`requested → pending` 允许吗？** 允许，但**仅出借方**通过"归还驳回（未收到）"触发；借阅方自己不能反悔。
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
| Borrower 若不存在，出借方可选择自动建号 | 登记物品时若 borrower username 未注册，出借方可确认后为其自动创建账号（见「未接管账号」词条）；若不选择建号，则视为无效 borrower |
| Lender / Borrower 中途不可更换 | 若发生"转借"（B 借来后再借给 C），由 B 作为 lender 新建一条 Item 表达，与原 Item 无关联 |
| 一条 Item 只涉及 1 借 1 还 | 不支持"一次借给多人"或"一次借出多物品"，拆成多条 Item |

---

## 未接管账号（Unclaimed Account）

出借方登记物品时，若借入方尚未注册，可为其**代为创建账号**——这类账号在借入方首次自行改密前，称为**未接管账号**。

### 相关术语

| 术语 | 含义 |
|------|------|
| 代建账号（Provision） | 出借方登记物品时，同一事务内为不存在的借入方创建 User + 建 Item，二者原子成功或一起回滚 |
| 初始凭证（Initial Credentials） | 代建账号时系统生成的用户名 + 一次性初始密码，**仅在创建/重置响应中出现一次**，供出借方转告借入方 |
| 未接管 / 已接管 | 账号是否仍在使用初始密码。**未接管**=借入方还没自行改过密码；一旦借入方自助改密即为**已接管** |
| 受限重置（Restricted Reset） | 借入方仍**未接管**时，出借方可重新生成其初始密码；借入方一旦接管（改密），出借方即永久失去该权限 |

### 边界与规则

- **未接管标记**是账号级状态（对应 `User.mustChangePassword`），不是 Item 级。
- 未接管账号登录后会收到「建议修改密码」的**强提示**，但**不强制**——可继续使用初始密码。
- **受限重置的双闸**：必须同时满足「操作者是该 Item 的出借方」且「借入方仍未接管」，缺一不可。
- 一个借入方可能被多个出借方各自借出物品；在其未接管期间，**任一关联出借方**都可触发受限重置（已知取舍，见契约文档）。

---

## 逾期（Overdue）——精确定义

「逾期」区分**标签**与**提醒触发**两层（二者都以 `backDate` 为界，但作用不同）。

### 逾期标签（UI）

**定义**：`returnStatus === 'pending' && today > backDate`

即：**只有 `pending`（借阅方尚未声明归还）过了应还日才显示逾期标签**。
- **`requested` 不显示逾期**：借阅方已声明归还，不再罚他挂逾期标签；防赖账改由出借方"归还驳回（未收到）"承担——驳回后打回 `pending`，若仍过期则重新逾期。
- **`confirmed` 永不逾期**：历史记录不挂逾期标签。

### 提醒触发（后端午夜扫描）

仍以 `backDate` 为界扫描 `today > backDate && returnStatus !== 'confirmed'`，但**提醒发给当前瓶颈方**（见「通知 - 提醒」）：`pending` 催借阅方归还，`requested` 催出借方确认。`lastAutoReminderDate` 防同日重复。

### 衍生行为

- **逾期 UI**：红色边框 + 逾期标签，仅 `pending` 逾期时显示，双方视图一致。
- **统计维度**：逾期 Item 数按上方**逾期标签**定义计（只算 pending 过期）。

---

## 通知（Notification）

一条通知是**送达给某个 User 的记录**，存储在 `notifications` 表。通知分**两类**（处理方式不同）：

### 提醒（Reminder）vs 事件通知（Event）

| 类别 | 语义 | 类型值 | 累积规则 |
|------|------|--------|---------|
| **提醒 Reminder** | 对某个**持续状态**的反复催促（还没还 / 还没确认） | `return_reminder` | **收敛**：每 (Item + 接收人) 只保留一条，重新触发时替换为最新（不堆积） |
| **事件通知 Event** | **一次性发生的离散事实** | `return_requested` / `return_confirmed` / `return_rejected` / `date_modified` | **追加**：每次一条新记录，不合并（可追溯、按时间排序） |

> 切分理由：提醒是"状态的镜像"，一件逾期物品应只对应一条提醒而非天天堆积；事件是独立事实，每条都有意义。

### 提醒接收人（跟随瓶颈方）

| 触发条件（过期时） | 瓶颈方 | 接收人 | 文案要点 |
|-------------------|--------|--------|---------|
| `pending` 过期 | 借阅方还没还 | **借阅方** | 请归还 |
| `requested` 过期 | 出借方还没确认 | **出借方** | 请确认收到 |

手动提醒（出借方点"提醒"）仅在 `pending` 可用（`requested` 时借阅方已声明归还，不再催其归还）。

### 通知类型（`Notification.type` 值域）

| 值 | 触发场景 | 接收者 |
|----|---------|--------|
| `return_reminder` | 出借方手动提醒 / 逾期自动提醒（按瓶颈方分接收人） | 借阅方或出借方 |
| `date_modified` | 借阅方修改了应还日期 | 出借方 |
| `return_requested` | 借阅方触发归还请求 | 出借方 |
| `return_confirmed` | 出借方触发归还确认 | 借阅方 |
| `return_rejected` | 出借方"未收到"驳回 | 借阅方 |

### 保留策略

通知有留存周期，超期由定时任务自动清理（具体天数与机制见代码常量 / CLAUDE.md，本词表不写死数字）。

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
