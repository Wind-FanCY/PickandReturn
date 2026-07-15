import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// 用于登录时序对齐：用户不存在时也对这个假 hash 跑一次 bcrypt.compare，
// 使"用户不存在"和"密码错误"两条路径耗时接近，防止通过响应时间枚举用户名。
const DUMMY_HASH = bcrypt.hashSync('timing-attack-mitigation-dummy', 10);

// cookie 的 secure 属性：默认生产环境为 true（只走 HTTPS）。
// 可用 COOKIE_SECURE 环境变量显式覆盖——例如备案前临时用 http://IP 访问时设为 false，
// 让登录 cookie 在 http 下也能保存；上了 HTTPS 后再翻回 true（或删除该变量）。
function cookieSecure() {
    if (process.env.COOKIE_SECURE !== undefined) {
        return process.env.COOKIE_SECURE === 'true';
    }
    return process.env.NODE_ENV === 'production';
}

function cookieOptions() {
    return {
        httpOnly: true,
        secure: cookieSecure(),
        sameSite: 'lax',
        maxAge: THIRTY_DAYS_MS
    };
}

// requireAuth 已挂 req.userId/req.username/req.session
async function getSession(req, res) {
    res.json({ username: req.username, language: req.session.language });
}

async function login(req, res) {
    const { username, password } = req.body || {};

    // 非字符串 username 会让 Prisma 抛校验错 → 500；这里当作凭证无效处理（且不泄露）
    if (typeof username !== 'string') {
        res.status(401).json({ error: 'user-not-registered' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { username } });

    // 时序对齐：无论用户是否存在都跑一次 bcrypt.compare（用户不存在时比对假 hash）
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatches =
        typeof password === 'string' && (await bcrypt.compare(password, hashToCompare));

    if (!user || !passwordMatches) {
        res.status(401).json({ error: 'user-not-registered' });
        return;
    }

    if (username.toLowerCase() === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }

    const sid = randomUUID();
    const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
    const session = await prisma.session.create({
        data: { sid, userId: user.id, language: user.language, expiresAt }
    });

    res.cookie('sid', sid, cookieOptions());
    req.log.info({ userId: user.id }, 'user logged in');
    res.json({ username: user.username, language: session.language });
}

async function logout(req, res) {
    await prisma.session.delete({ where: { sid: req.sid } });
    res.clearCookie('sid', {
        httpOnly: true,
        secure: cookieSecure(),
        sameSite: 'lax'
    });
    res.json({ username: req.username });
}

async function patchSession(req, res) {
    const { language } = req.body || {};
    if (language !== 'zh' && language !== 'en') {
        res.status(400).json({ error: 'invalid-language' });
        return;
    }

    const [session] = await prisma.$transaction([
        prisma.session.update({ where: { sid: req.sid }, data: { language } }),
        prisma.user.update({ where: { id: req.userId }, data: { language } })
    ]);

    res.json({ username: req.username, language: session.language });
}

export default {
    getSession,
    login,
    logout,
    patchSession
};
