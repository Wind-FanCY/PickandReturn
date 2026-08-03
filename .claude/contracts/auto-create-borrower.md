# 契约:出借时自动创建借入方账号

> 本文件是 backend / frontend / uiux 三方的**唯一事实源**。任何字段名、错误码、响应形状以此为准。
> 若实现中发现契约需调整,**先回到主 Claude 改这里**,再改代码——不得各自默认。

## 背景决策(grill 共识摘要)

- 出借方填物品表单时,若"借入方"用户名不存在,询问是否为其创建账号;确认后自动建号 + 建物品。
- **不强制改密**;借入方首次登录给强提示横幅(不拦操作)。
- 出借方在借入方"未接管"期间可重置初始密码;借入方一旦改密即永久失去该权限。
- 已接管账号的密码找回 = **范围外**(运维手动兜底,不加 email)。

## 数据模型变更

`prisma/schema.prisma` 的 `User` 模型新增字段:

```prisma
mustChangePassword Boolean @default(false) @map("must_change_password")
```

- 存量用户默认 `false`,无数据迁移风险。
- 自动创建的借入方账号建号时置 `true`;借入方成功自助改密后置 `false`。
- 需生成并应用迁移(`prisma migrate dev --name add_must_change_password`)。

## 密码生成规则(util)

- 位置建议:`server/services/password-generator.js`(或 `lib/`,backend 定夺,但须可被 provision/reset 复用)。
- **crypto 强随机**(`crypto.randomInt`),**禁用 `Math.random`**。
- 长度 **12**,字符集排除易混字符:去掉 `0 O o 1 l I`。
- 返回明文;调用方负责 `bcrypt.hash(pwd, 10)`。**明文绝不落库、绝不进日志。**

## 用户名规则(自动建号)

- 借入方字段 = ASCII 用户名,**复用注册那套**:`/^[a-zA-Z0-9_]+$/` + 敏感词过滤(`content-filter.js`)+ `dog`/`demo` 禁用。
- 唯一性由 DB `@unique` 约束保证;抢注竞态 → 事务回滚 → 返回 `user-already-exists`。

---

## API 契约

### 1. `POST /api/v1/items`(改)—— addItem 增加 createBorrower 分支

**请求体**(新增可选 `createBorrower`):
```json
{
  "itemInfo": {
    "itemDetail": "string",
    "borrower": "ascii_username",
    "lentDate": "YYYY-MM-DD",
    "backDate": "YYYY-MM-DD",
    "modifyLimit": 3
  },
  "createBorrower": true
}
```

**行为分支:**
- 借入方存在 → 原行为不变(创建物品,201,返回 `serializeItem`)。
- 借入方不存在 **且** `createBorrower` 不为真 → 原行为:`404 { "error": "userNotExist" }`。
- 借入方不存在 **且** `createBorrower === true` → 进入 `borrower-provision` 事务:
  - 校验用户名(正则/敏感词/dog/demo);不合法按对应错误码返回(`required-username` / `sensitive-content` / `auth-insufficient` / `bad-request`)。
  - `$transaction`(回调式):建 user(`mustChangePassword:true`)→ 建 item(`borrowerId=新user.id`)。bcrypt 在事务外。
  - 成功 **201**,响应形状见下(比普通 addItem 多一个 `borrowerCredentials`)。
  - 唯一约束冲突(竞态)→ `409 { "error": "user-already-exists" }`。

**成功响应(建号分支,201):**
```json
{
  "item": { "...": "serializeItem 的完整结构" },
  "borrowerCredentials": {
    "username": "ascii_username",
    "initialPassword": "明文,仅此一次"
  }
}
```
> ⚠️ 普通分支(借入方已存在)响应保持现状:**直接是 item 对象**(无 `item`/`borrowerCredentials` 包裹)。
> 前端据 `createBorrower` 是否为真来决定按哪种形状解析。

### 2. `POST /api/v1/users/me/password`(新)—— 自助改密

- 需认证。
- **请求体:** `{ "oldPassword": "string", "newPassword": "string" }`
- 校验:`bcrypt.compare(oldPassword, user.passwordHash)` 不通过 → `403 { "error": "wrong-password" }`。
- `newPassword` 复用最小长度 6:不足 → `400 { "error": "required-password" }`。**不过敏感词。**
- 成功:写新哈希 + **置 `mustChangePassword=false`** → `200 { "ok": true }`。
- 改密后**不**踢其他 session(TODO,本期不做)。

### 3. `POST /api/v1/items/:id/reset-borrower-password`(新)—— 出借方受限重置

- 需认证。
- **授权双闸:**
  - `item.lenderId === req.userId`,否则 `403 { "error": "forbidden" }`。
  - `item.borrower.mustChangePassword === true`,否则 `403 { "error": "forbidden" }`(借入方已接管,不可重置)。
- item 不存在 → `404 { "error": "item-missing" }`。
- 行为:重新生成初始密码 → `bcrypt.hash` 更新借入方 → **保持 `mustChangePassword=true`**。
- **成功响应(200):**
```json
{
  "borrowerCredentials": {
    "username": "ascii_username",
    "initialPassword": "新明文,仅此一次"
  }
}
```

### 4. session 响应(改)—— 传播 mustChangePassword

- `GET /api/v1/session` 与 `POST /api/v1/session`(login)的成功响应,**新增字段 `mustChangePassword: boolean`**。
- 前端据此在首次登录时决定是否显示"强提示横幅"。
- 现有字段(`username`、`language` 等)不变。

### 5. serializeItem(改)—— 借入方标记暴露给前端

- `server/services/item-presenter.js` 的 `serializeItem`,在 `borrower` 里**增加 `mustChangePassword`** 字段。
- 前端据此在出借方视图中,对"未接管"的借入方显示"重置初始密码"入口。

---

## 错误码清单(i18n 键,主已在 i18n.js 加好中英)

| 错误码 | 场景 | 是否新增 |
|---|---|---|
| `userNotExist` | 借入方不存在(未选建号) | 已有 |
| `user-already-exists` | 建号时用户名被抢注 | 已有 |
| `required-username` | 用户名格式非法 | 已有 |
| `sensitive-content` | 用户名含敏感词 | 已有 |
| `auth-insufficient` | 用户名为 dog | 已有 |
| `required-password` | 新密码太短 | 已有 |
| `wrong-password` | 改密时旧密码错误 | **新增** |
| `forbidden` | 重置授权不通过 | 已有 |
| `item-missing` | 物品不存在 | 已有 |

## 前端文案 i18n 键(主已加好中英,前端只引用)

- `borrower.createTitle` — 建号确认标题
- `borrower.createPrompt` — "用户 {name} 不存在,是否为其创建账号?"(带占位)
- `borrower.confirm` / `borrower.cancel`
- `borrower.credentialsTitle` — 凭证回显标题
- `borrower.usernameLabel` / `borrower.passwordLabel`
- `borrower.copy` / `borrower.copied` / `borrower.copyFailed`
- `borrower.credentialsWarning` — "请立即复制并转告借入方,关闭后无法再次查看(可稍后重置)"
- `borrower.done` — 完成/关闭
- `borrower.resetEntry` — 出借方视图"重置初始密码"入口文案
- `borrower.resetConfirm` — 重置确认提示
- `mustChange.banner` — 首登横幅文案
- `mustChange.action` — 横幅上"去修改"按钮
- `changePwd.title` / `changePwd.oldLabel` / `changePwd.newLabel` / `changePwd.confirmLabel`
- `changePwd.submit` / `changePwd.success` / `changePwd.mismatch`
- 错误码文案:`wrong-password`

## 前端路由

- 新增 `/change-password`(需登录)→ 改密页组件。

## CLAUDE.md 硬约束(所有 agent 必须遵守)

- Controller 只做请求/响应,业务逻辑进 `server/services/`。
- 数据操作走 `lib/prisma.js` 单例。
- 前端:禁 `alert/confirm/prompt`、禁内联 `style`、禁 CSS-in-JS;class 用 kebab-case/BEM;语义化 HTML;触发操作用 `<button>`;不在 React 外部操作 DOM(`createPortal` 允许,属 React 官方 API)。
- 请求/响应皆 JSON。
