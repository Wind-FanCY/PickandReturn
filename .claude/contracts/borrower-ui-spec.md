# UI/UX 规格:自动创建借入方账号(frontend 实现依据)

> 由 uiux agent 产出,主 Claude 审定。依据契约 `auto-create-borrower.md` + 现有 token(`src/index.css`)+ 视觉语言(`Item.css`/`LoginForm.css`)。
> 主决策补充:①新增通用 i18n 键 `common.close`(已加,供关闭按钮 aria-label);②横幅持久化策略见 §3。

## 组件文件（建议路径）

| 组件 | 路径 |
|---|---|
| 通用 Modal | `src/components/Modal/Modal.jsx` + `Modal.css` |
| 凭证回显面板 | `src/features/borrower/BorrowerCredentials.jsx` + `.css` |
| 首登强提示横幅 | `src/components/MustChangeBanner/MustChangeBanner.jsx` + `.css` |
| 改密表单 | `src/features/auth/ChangePasswordForm.jsx` + `.css` |

---

## 1. 通用 Modal

**范围锁死(不做):** 无开合动画;无完整焦点捕获(仅打开时聚焦首个可聚焦元素,Tab 可离开,已接受);不支持多层堆叠。

**新增 token**(加到 `src/index.css`):
```
--color-overlay: rgba(28, 43, 18, 0.45);   /* 用 text-primary 色相做遮罩,非纯黑 */
```
其余复用:`--z-modal`(200)、`--shadow-panel`、`--radius-lg`、`--color-surface-raised`、`--color-border-strong`、`--space-md/lg`、断点 768px、`--touch-target`。

**结构:** `createPortal` 到 `document.body`。
```jsx
<div className="modal" onClick={dismissOnBackdrop ? onClose : undefined}>
  <div className="modal__panel" role="dialog" aria-modal="true"
       aria-labelledby={titleId} onClick={(e)=>e.stopPropagation()} ref={panelRef}>
    <button className="modal__close" type="button"
            aria-label={t(lang,'common.close')} onClick={onClose}>×</button>
    <div className="modal__content">{children}</div>
  </div>
</div>
```

**视觉:**
- `.modal`:`position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:var(--color-overlay); z-index:var(--z-modal); padding:var(--space-lg)`(移动 `--space-md`)。
- `.modal__panel`:`width:min(480px,92vw)`(移动 `calc(100% - 32px)`);`max-height:85dvh`(移动 90dvh);`overflow-y:auto`;`background:var(--color-surface-raised)`;`border:1px solid var(--color-border-strong)`;`border-radius:var(--radius-lg)`;`box-shadow:var(--shadow-panel)`;`padding:var(--space-lg)`(移动 `--space-md`)。
- `.modal__close`:右上角 `position:absolute; top/right:var(--space-md)`;32×32(移动触控区 ≥44×44);`color:var(--color-text-secondary)`;hover `--color-primary`;focus-visible 用全局 outline 规则。
- `.modal__content`:`margin-top:var(--space-sm)`。

**行为:**
- `dismissOnBackdrop=true`:点遮罩(非面板,靠 stopPropagation 区分)或 Esc → onClose。
- `dismissOnBackdrop=false`:遮罩/Esc 均不关;只有 `.modal__close` 或 children 内按钮能关。
- Esc 监听仅在 `dismissOnBackdrop=true` 时挂载,useEffect 清理时移除。
- 打开时聚焦 `panelRef` 内首个可聚焦元素,查不到则给 panel `tabIndex=-1` 聚焦自身。

**建号确认对话框**直接用本 Modal(`dismissOnBackdrop=true`):`borrower.createTitle` / `borrower.createPrompt(name)` + 按钮 `borrower.confirm`(主色,参考 `.login__button`)/ `borrower.cancel`(朴素描边,参考 `.item__confirm-no`)。

---

## 2. 凭证回显面板(套在 Modal 内,`dismissOnBackdrop=false`)

复用 token:`--font-mono`、`--color-bg-alt`、`--color-accent-light/dark`、`--color-success`、`--color-danger`、`--radius-sm`、`--text-lg/xs`。

**结构:**
```jsx
<div className="borrower-credentials">
  <h2 id="borrower-credentials-title" className="borrower-credentials__title">{t('borrower.credentialsTitle')}</h2>
  <dl className="borrower-credentials__fields">
    <div className="borrower-credentials__field">
      <dt className="borrower-credentials__label">{t('borrower.usernameLabel')}</dt>
      <dd className="borrower-credentials__value borrower-credentials__value--mono">{username}</dd>
    </div>
    <div className="borrower-credentials__field">
      <dt className="borrower-credentials__label">{t('borrower.passwordLabel')}</dt>
      <dd className="borrower-credentials__value borrower-credentials__value--mono borrower-credentials__value--password">{initialPassword}</dd>
    </div>
  </dl>
  <button type="button" className="borrower-credentials__copy" onClick={handleCopy}>
    {copyState==='idle' && t('borrower.copy')}
    {copyState==='success' && t('borrower.copied')}
    {copyState==='failed' && t('borrower.copyFailed')}
  </button>
  <span aria-live="polite" className="sr-only">{copyAnnouncement}</span>
  <p className="borrower-credentials__warning" role="note">{t('borrower.credentialsWarning')}</p>
  <button type="button" className="borrower-credentials__done" onClick={onDone}>{t('borrower.done')}</button>
</div>
```
外层 `<Modal dismissOnBackdrop={false} titleId="borrower-credentials-title" onClose={onDone}>`——Modal 的 × 与"完成"按钮**同指 onDone**。

**视觉:**
- `.borrower-credentials`:Flexbox column,`gap:var(--space-md)`;桌面/移动结构一致。
- `.borrower-credentials__title`:`var(--font-display)`,`var(--text-lg)`,复用 h2 斜体。
- `.borrower-credentials__label`:`var(--font-mono)`,`var(--text-xs)`,大写,`letter-spacing:0.08em`,`color:var(--color-text-secondary)`(同 `.label__title`)。
- `.borrower-credentials__value--mono`:`var(--font-mono)`,`var(--text-lg)`,`letter-spacing:0.03em`;芯片容器 `background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:0.4rem 0.7rem`。
- `.borrower-credentials__value--password`:`user-select:text`(不要禁选)。
- `.borrower-credentials__copy`:复用 `.item__edit-btn`(`--color-primary-light` 底 + `--color-primary` 字 + `--radius-xs`),`width:100%`。
- `.borrower-credentials__warning`:`background:var(--color-accent-light); color:var(--color-accent-dark); border:1px solid rgba(181,137,10,0.3); border-radius:var(--radius-sm); padding:var(--space-sm) var(--space-md); font-size:var(--text-sm)`(金色"提醒",非红色报错)。
- `.borrower-credentials__done`:复用 `.login__button`(实心 `--color-primary`,`width:100%`)。

**复制交互:** `navigator.clipboard.writeText`;成功→按钮文案 `borrower.copied` + `--color-success`,2 秒恢复;失败(如非安全上下文)→ `borrower.copyFailed` + `--color-danger`,并让密码可选中手动复制。`aria-live="polite"` 的 `.sr-only` 同步播报(若无 `.sr-only` 工具类,在本组件 css 加:`position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)`)。
- warning 用 `role="note"`(不用 `role="alert"`)。

---

## 3. 首登强提示横幅

**持久化策略(主已定):** 当次会话可关闭(点 × 后本会话不再显示),**不写 localStorage**;下次登录只要后端 `mustChangePassword` 仍为 true 就再次出现。

**位置:** 非 `fixed`。作为登录后主内容区最顶部的普通文档流元素(Header 下方、路由内容上方),把内容往下推,无需 z-index。

复用 token:`--color-accent-light/dark/accent`、`--space-sm/md`、`--radius-sm`、`--touch-target`、`--font-mono/body`。

**结构:**
```jsx
{mustChangePassword && bannerVisible && (
  <div className="must-change-banner" role="status">
    <p className="must-change-banner__text">{t('mustChange.banner')}</p>
    <button type="button" className="must-change-banner__action"
            onClick={()=>navigate('/change-password')}>{t('mustChange.action')}</button>
    <button type="button" className="must-change-banner__close"
            aria-label={t(lang,'common.close')} onClick={()=>setBannerVisible(false)}>×</button>
  </div>
)}
```

**视觉:**
- `.must-change-banner`:`background:var(--color-accent-light); border-bottom:1px solid rgba(181,137,10,0.3); padding:var(--space-sm) var(--space-lg)`(移动 `--space-md`);桌面 `display:flex; align-items:center; gap:var(--space-md)`;移动 `flex-wrap:wrap; gap:var(--space-sm)`。
- `.must-change-banner__text`:`var(--font-body)`,`var(--text-sm)`,`color:var(--color-accent-dark)`;桌面 `flex:1 1 auto`,移动 `flex:1 1 100%`。
- `.must-change-banner__action`:`background:var(--color-accent-dark); color:white`;`var(--font-mono)`,`var(--text-xs)`,大写字距 0.04em;hover `--color-accent` + `translateY(-1px)`;移动 `width:100%; min-height:var(--touch-target)`。
- `.must-change-banner__close`:24×24(移动 ≥44);`color:var(--color-accent-dark)`;hover `--color-accent`。
- `role="status"`(不打断朗读)。

**接线:** `mustChangePassword` 来自 session(全局 state)。横幅挂在登录后布局的顶部(如 `MainContent` 或 App 的已登录区)。

---

## 4. 改密表单(`/change-password`,需登录)

**与 LoginForm 关系:** 复制视觉数值,独立 class(`.change-pwd*`)+ 独立 css,不跨文件共享 class。

复用 token:同 `LoginForm.css`(`--color-surface-raised`、`--color-border-strong`、`--color-primary`、`--radius-md/sm`、`--shadow-lg`、`--font-display/mono/body`、`--text-2xl/xs/base`、`--color-danger/success`、`--transition-fast`)。

**结构:**
```jsx
<div className="change-pwd">
  <form className="change-pwd__form" onSubmit={handleSubmit}>
    <h1 className="change-pwd__title">{t('changePwd.title')}</h1>
    <label className="change-pwd__label"><span className="change-pwd__label-title">{t('changePwd.oldLabel')}</span>
      <input type="password" className="change-pwd__input" value={oldPassword} onChange={...} /></label>
    {errors.oldPassword && <p className="change-pwd__field-error">{errors.oldPassword}</p>}
    <label className="change-pwd__label"><span className="change-pwd__label-title">{t('changePwd.newLabel')}</span>
      <input type="password" className="change-pwd__input" value={newPassword} onChange={...} /></label>
    <label className="change-pwd__label"><span className="change-pwd__label-title">{t('changePwd.confirmLabel')}</span>
      <input type="password" className="change-pwd__input" value={confirmPassword} onChange={...} /></label>
    {errors.mismatch && <p className="change-pwd__field-error">{t('changePwd.mismatch')}</p>}
    {success && <p className="change-pwd__success">{t('changePwd.success')}</p>}
    <button type="submit" className="change-pwd__submit" disabled={submitting}>{t('changePwd.submit')}</button>
  </form>
</div>
```

**视觉:** 逐项对齐 `.login`/`.login__form`/`.login__title`/`.login__label`/`.label__input`/`.login__field-error`/`.login__button`。移动端同 `.login` 移动规则(卡片 `width:100%`,`align-items:flex-start`,input `min-height:var(--touch-target)` + 16px 字号防 iOS 缩放)。新增成功态 `.change-pwd__success`:`color:var(--color-success); background:var(--color-success-light); font-family:var(--font-mono); font-size:var(--text-sm); border-radius:var(--radius-sm); padding:var(--space-sm) var(--space-md)`。

**交互:**
- 客户端:确认新密码 ≠ 新密码 → `changePwd.mismatch`,拦截不发请求。
- 服务端 `wrong-password` → "当前密码"字段下显示该错误码文案。
- 提交中 `disabled`(`opacity:0.5; cursor:not-allowed`)。
- 成功 → 显示 `changePwd.success`;是否自动跳回 `/items` 由 frontend 定(非视觉范畴)。

---

## 交付检查表
1. `Modal.jsx`+`.css`(+ `--color-overlay` token 加到 index.css)
2. `BorrowerCredentials.jsx`+`.css`(内嵌 Modal,dismissOnBackdrop=false)
3. `MustChangeBanner.jsx`+`.css`(当次会话可关、非持久化、非 fixed)
4. `ChangePasswordForm.jsx`+`.css`(数值对齐 LoginForm)+ 路由 `/change-password`
5. 所有文案引用契约 i18n 键;关闭按钮用 `common.close`(已加)
