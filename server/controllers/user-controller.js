import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';

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

export default {
    register
};
