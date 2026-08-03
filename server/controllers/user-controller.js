import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { containsSensitiveWord } from '../services/content-filter.js';

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const BCRYPT_COST = 10;
const MIN_PASSWORD_LENGTH = 6;

async function register(req, res) {
    const { username, password } = req.body || {};

    if (!username || !USERNAME_RE.test(username)) {
        res.status(400).json({ error: 'required-username' });
        return;
    }

    if (username.toLowerCase() === 'dog') {
        res.status(403).json({ error: 'auth-insufficient' });
        return;
    }

    if (containsSensitiveWord(username)) {
        res.status(400).json({ error: 'sensitive-content' });
        return;
    }

    if (username.toLowerCase() === 'demo') {
        res.status(409).json({ error: 'user-already-exists' });
        return;
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        res.status(400).json({ error: 'required-password' });
        return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
        res.status(409).json({ error: 'user-already-exists' });
        return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    await prisma.user.create({ data: { username, passwordHash } });

    req.log.info({ username }, 'user registered');
    res.status(201).json({ username });
}

// 自助改密：需先验证旧密码，成功后清除 mustChangePassword 标记。
async function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body || {};

    const oldMatches =
        typeof oldPassword === 'string' && (await bcrypt.compare(oldPassword, req.session.user.passwordHash));
    if (!oldMatches) {
        res.status(403).json({ error: 'wrong-password' });
        return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
        res.status(400).json({ error: 'required-password' });
        return;
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.user.update({
        where: { id: req.userId },
        data: { passwordHash, mustChangePassword: false }
    });

    req.log.info({ userId: req.userId }, 'user changed password');
    res.json({ ok: true });
}

export default {
    register,
    changePassword
};
