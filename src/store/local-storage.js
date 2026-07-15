// 唯一允许直接调用 localStorage 的地方。只缓存非敏感偏好：语言、上次登录用户名。
// 绝不缓存密码 / sid / 其他敏感信息。
const KEYS = {
    LANG: 'pnr.lang',
    LAST_USERNAME: 'pnr.lastUsername'
};

export const localPrefs = {
    getLang() {
        return localStorage.getItem(KEYS.LANG) || 'zh';
    },
    setLang(v) {
        localStorage.setItem(KEYS.LANG, v);
    },
    getLastUsername() {
        return localStorage.getItem(KEYS.LAST_USERNAME) || '';
    },
    setLastUsername(v) {
        localStorage.setItem(KEYS.LAST_USERNAME, v);
    }
};
