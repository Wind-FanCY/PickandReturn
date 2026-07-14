import prisma from '../../lib/prisma.js';

// 保护路由前置中间件：校验 sid cookie → 查 Session 表 → 挂 req.userId/req.username。
// 保留 "dog" 禁用规则（大小写不敏感，与注册/登录一致）。
export default async function requireAuth(req, res, next) {
    const sid = req.cookies.sid;
    if (!sid) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const session = await prisma.session.findUnique({
        where: { sid },
        include: { user: true }
    });

    if (!session || session.expiresAt <= new Date()) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    if (session.user.username.toLowerCase() === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }

    req.userId = session.user.id;
    req.username = session.user.username;
    req.sid = sid;
    req.session = session;
    next();
}
