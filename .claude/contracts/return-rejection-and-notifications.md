# 契约:归还驳回 + 通知模型重构(阶段二)

> 本文件是 backend / frontend / uiux 三方的**唯一事实源**。字段名、错误码、状态转移、通知类型、响应形状以此为准。
> 若实现中发现契约需调整,**先回到主 Claude 改这里**,不得各自默认。
> 背景决策来自一场 grilling+domain-modeling(Q3–Q8),详见下方摘要。

## 决策摘要(grill 共识)

| # | 决策 |
|---|---|
| Q3 | 通知留存 **30 天**、不分读写、复用午夜任务清理 |
| Q4 | 切分**提醒(Reminder) vs 事件通知(Event)**:提醒每 (item, 接收人) 只保留一条;事件追加 |
| Q5 | 提醒接收人跟随**瓶颈方**:`pending` 过期→借阅方;`requested` 过期→出借方 |
| Q7 | 逾期**标签**只给 `pending`;`requested` 不显示逾期;提醒**触发**仍按 `backDate` |
| Q8 | 新增**驳回**:出借方"未收到" → `requested → pending` |

**这推翻了 CONTEXT.md 三条原决定**(第 38 行 requested→pending 不允许、第 93 行 requested 算逾期、第 145 行"追加而非合并"对提醒的部分)——需在本功能 PR 同步改 CONTEXT + 立 ADR。

## 数据模型

**无需 schema 迁移。** 理由:
- `return_rejected` 只是 `Notification.type` 的新字符串值,非枚举、无需改表。
- 驳回复用现有 `returnStatus` / `returnedAt`,不加列。
- 通知清理是一次 `deleteMany` 查询,不加列。
- 提醒收敛用**应用层"先删后建"**(见下),不需要唯一约束(唯一约束会误伤可重复的 `date_modified` 事件通知)。

> ⚠️ 不要给 `notifications` 加 `@@unique`。事件通知(如 `date_modified`)本就允许同一 item 多条。

---

## 一、通知模型:提醒 vs 事件(Q4)

两类通知,处理方式不同:

| 类别 | type 值 | 语义 | 处理 |
|------|---------|------|------|
| **提醒 Reminder** | `return_reminder` | 对"持续状态"的反复催促 | **每 (relatedItemId, userId) 只保留一条**:生成前先 `deleteMany` 掉该 item+接收人已有的 `return_reminder`,再 `create` 新的 |
| **事件 Event** | `return_requested` / `return_confirmed` / `date_modified` / `return_rejected` | 一次性离散事实 | **追加**,不去重(维持现状) |

**提醒收敛实现**(自动 + 手动提醒都适用):
```
// 伪码:在事务内
tx.notification.deleteMany({ where: { relatedItemId, userId: <接收人>, type: 'return_reminder' } })
tx.notification.create({ data: { type:'return_reminder', message, userId:<接收人>, relatedItemId } })
```
效果:任一时刻每个物品对每个接收人最多一条提醒,永远是最新。**不做**"已提醒 N 次"计数(留待将来)。

---

## 二、逾期语义(Q7)

拆成**标签**与**触发**两层:

- **逾期标签(前端 UI 红标)**:只在 `returnStatus === 'pending' && backDate < today` 时显示。**`requested` 不再显示逾期标签。**
  - 改 `src/components/Item/Item.jsx:36` 与 `src/features/return/ReturnItem.jsx:22` 的 `isOverdue` 计算:由 `!isConfirmed && ...` 改为 `returnStatus === 'pending' && ...`。
- **提醒触发(后端午夜扫描)**:**仍按 `backDate`**,条件不变(`backDate < today && returnStatus !== 'confirmed'`,覆盖 pending 和 requested),但接收人按状态分(见三)。

---

## 三、自动提醒重构(Q4+Q5+Q7)——`server/services/reminder.js`

午夜扫描 `backDate < today && returnStatus !== 'confirmed'` 的 Item,对每个:

| 物品状态 | 瓶颈方 | 接收人 | 消息(后端中文字符串) |
|---------|--------|--------|----------------------|
| `pending` | 借阅方还没还 | **borrower** | `{lender} 提醒您归还物品:{itemDetail},应还日期 {backDate}`(维持现状) |
| `requested` | 出借方还没确认 | **lender** | `{borrower} 已归还《{itemDetail}》,请确认收到` |

- 每条提醒按"一、提醒收敛"处理(先删后建,针对该 item + 该接收人)。
- `lastAutoReminderDate` 防同日重复的机制保留。
- 通知 message 沿用**后端硬编码中文**(项目现状,通知无 i18n),不引入 i18n 键。

---

## 四、手动提醒 `sendNotice`——`item-controller.js`

- **新增状态守卫:仅 `returnStatus === 'pending'` 允许**(出借方手动提醒借阅方归还;`requested` 时借阅方已声明归还,不应再催其归还)。非 pending 返回 `409 { "error": "invalid-state" }`。
- 生成的 `return_reminder` 也走"提醒收敛"(先删后建 item+borrower 的旧提醒)。
- 现有的出借方本人校验、1 小时冷却(`rate-limited`)保留。

---

## 五、归还驳回(Q8)——新端点

### `POST /api/v1/items/:id/reject-return`(新)
- 需认证。
- **授权双闸**:
  - `item.lenderId === req.userId`,否则 `403 { "error": "forbidden" }`。
  - `item.returnStatus === 'requested'`,否则 `409 { "error": "invalid-state" }`。
- item 不存在 → `404 { "error": "item-missing" }`。
- **行为(事务,状态守卫下推 SQL,参考 return-flow.js)**:
  - `updateMany({ where:{ id, returnStatus:'requested' }, data:{ returnStatus:'pending', returnedAt:null } })`;`count===0` 视为竞态 → 返回 null → controller 转 409。
  - 创建 `return_rejected` 事件通知给**借阅方**:`{lender} 表示未收到《{itemDetail}》,请核实并重新归还`。
  - **不重置 `backDate`**(保留原应还日;打回后若已过期,借阅方将重新逾期并被提醒——防赖账机制)。
  - **不动** `modifyLimit` / `modifyRemaining`。
- **成功响应 200**:`serializeItem(updated)`(与 confirm-return 一致)。
- service 建议放 `server/services/return-flow.js`,新增 `rejectReturn(item)`,与 `requestReturn` / `confirmReturn` 并列。

### 状态机(更新后)
```
pending ──request-return(借阅方)──> requested ──confirm-return(出借方)──> confirmed
   ^                                    │
   └──────reject-return(出借方)─────────┘
```

---

## 六、通知清理任务(Q3)——新 service

- 新建 `server/services/notification-cleanup.js`,导出 `cleanupOldNotifications()`:
  `deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })`。
- 留存期常量:`NOTIFICATION_RETENTION_DAYS = 30`(放 `server/constants.js`),`RETENTION_MS = 30*24*60*60*1000`。
- 挂到 `server.js` 的午夜任务 `runMidnightJobsSafely()` 里(与 `runAutoReminder`、`cleanupExpiredSessions` 并列),独立 try/catch,失败不影响其他 job。
- 不分读写,按 `createdAt` 一刀切。

---

## 七、前端

- **出借方"未收到"按钮**:在 `src/components/Item/Item.jsx` 出借方视图、`requested` 状态下,于"确认收到"旁增加"未收到"按钮 → 二次确认(复用通用 `<Modal>`,`dismissOnBackdrop=true`)→ 调 `fetchRejectReturn(id)` → dispatch 更新该 item。
- **services**:`src/services/services.js` 新增 `fetchRejectReturn(id)`(`POST /items/:id/reject-return`)。
- **reducer**:驳回成功后更新 `items[id]`(可复用现有 `CONFIRM_RETURN` 式的 replace,或新增 `REJECT_RETURN` action;倾向复用一个通用"replace item"路径,避免冗余 action)。
- **逾期标签**:按"二"改两处 `isOverdue` 计算(只 pending 显示)。
- **借阅方视图**:`requested` 被驳回后 item 变回 `pending`,借阅方列表自然回到"待归还 + 可操作";无需特殊处理,靠重新拉取/state 更新即可。收到 `return_rejected` 通知会在通知中心显示(现有机制)。

## 八、i18n 键(前端 UI,主统一加好;通知消息是后端中文不涉 i18n)

- `item.reject` — 出借方"未收到"按钮
- `item.rejectConfirm` — 驳回二次确认文案(如"确认标记为未收到?物品将退回待归还状态。")
- `item.rejectConfirmYes` / 可复用现有 `item.confirm` / `item.cancel`
- 成功提示:`success.returnRejected`(如"已标记未收到")

## 九、需同步更新的文档(本功能 PR 内)

- **CONTEXT.md**:
  - 第 38 行:`requested → pending` 由"不允许"改为"出借方可驳回(未收到)";
  - 逾期章节:标签只给 `pending`,`requested` 不逾期(改第 111/115 行的"requested 也算逾期");
  - 通知章节:补 `return_rejected` 类型;"追加而非合并"补充说明——**仅事件通知追加,提醒收敛为一条**;
  - 归还动作表:补"归还驳回"一行。
- **CLAUDE.md**:API 端点表补 `reject-return`;午夜任务补通知清理。
- **ADR**:新建 `docs/adr/0001-return-rejection-and-notification-model.md`,记录:归还机由单向改为带驳回回退、通知切分提醒/事件、逾期语义调整——三条推翻原 v1 决定的理由与取舍。(主 Claude 写)

## 十、测试(backend agent)

`tests/` 下补:
- 驳回成功(`requested→pending`、returnedAt 清空、backDate 不变、借阅方收到 return_rejected)
- 驳回双闸拒绝(非出借方 403、非 requested 状态 409、item 不存在 404)
- 手动提醒 pending 才允许(requested 时 409)
- 提醒收敛:同一 item+接收人重复触发只剩一条 return_reminder
- 通知清理:超 30 天的被删、未超的保留
- 自动提醒按状态分接收人(pending→borrower、requested→lender)
- 完成后 `npm run lint` + `npm run test:run` 全绿

## 约束(所有 agent)

遵守 `CLAUDE.md`:Controller 只做请求/响应,业务进 `server/services/`;数据走 `lib/prisma.js` 单例;多表写用 `$transaction`;前端禁 alert/confirm(用 Modal)、禁内联 style、BEM、语义化、`createPortal` 允许;请求/响应皆 JSON。明文/敏感字段不进日志。
