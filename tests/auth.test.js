import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import app from '../app.js';
import prisma from '../lib/prisma.js';
import { createUser, login, registerAndLogin } from './helpers.js';
import { createLoginLimiter, createRegisterLimiter } from '../server/middleware/login-rate-limit.js';
import { cleanupExpiredSessions } from '../server/services/session-cleanup.js';

describe('POST /api/v1/users (register)', () => {
    it('registers a new user successfully', async () => {
        const res = await createUser(app, { username: 'alice', password: 'password1' });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ username: 'alice' });
    });

    it('rejects duplicate usernames', async () => {
        await createUser(app, { username: 'alice', password: 'password1' });
        const res = await createUser(app, { username: 'alice', password: 'password2' });
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'user-already-exists' });
    });

    it('rejects invalid usernames', async () => {
        const res = await createUser(app, { username: 'a l i c e!', password: 'password1' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-username' });
    });

    it('rejects passwords shorter than 6 characters', async () => {
        const res = await createUser(app, { username: 'alice', password: '123' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-password' });
    });

    it('rejects username "dog"', async () => {
        const res = await createUser(app, { username: 'dog', password: 'password1' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'auth-insufficient' });
    });

    it('rejects the reserved username "demo" (case-insensitive)', async () => {
        const res = await createUser(app, { username: 'DEMO', password: 'password1' });
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'user-already-exists' });
    });

    it('never stores the plaintext password', async () => {
        await createUser(app, { username: 'alice', password: 'password1' });
        const user = await prisma.user.findUnique({ where: { username: 'alice' } });
        expect(user.passwordHash).not.toBe('password1');
        expect(user.passwordHash.startsWith('$2')).toBe(true);
    });
});

describe('POST /api/v1/session (login)', () => {
    it('logs in successfully and sets the sid cookie', async () => {
        await createUser(app, { username: 'alice', password: 'password1' });
        const { res } = await login(app, { username: 'alice', password: 'password1' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ username: 'alice', language: 'zh' });
        expect(res.headers['set-cookie'][0]).toMatch(/sid=/);
    });

    it('rejects a wrong password without revealing which part was wrong', async () => {
        await createUser(app, { username: 'alice', password: 'password1' });
        const { res } = await login(app, { username: 'alice', password: 'wrong-password' });
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'user-not-registered' });
    });

    it('rejects a nonexistent user', async () => {
        const { res } = await login(app, { username: 'nobody', password: 'password1' });
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'user-not-registered' });
    });

    it('rejects username "dog" even if the row exists', async () => {
        const passwordHash = (await import('bcrypt')).default.hashSync('password1', 10);
        await prisma.user.create({ data: { username: 'dog', passwordHash } });
        const { res } = await login(app, { username: 'dog', password: 'password1' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'auth-insufficient' });
    });
});

describe('session lifecycle', () => {
    it('GET /session returns 401 without a cookie', async () => {
        const res = await request(app).get('/api/v1/session');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'auth-missing' });
    });

    it('GET /session returns username/language once logged in', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent.get('/api/v1/session');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ username: 'alice', language: 'zh' });
    });

    it('PATCH /session rejects invalid languages', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent.patch('/api/v1/session').send({ language: 'fr' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'invalid-language' });
    });

    it('PATCH /session updates and persists the language preference', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const patchRes = await agent.patch('/api/v1/session').send({ language: 'en' });
        expect(patchRes.status).toBe(200);
        expect(patchRes.body).toEqual({ username: 'alice', language: 'en' });

        const getRes = await agent.get('/api/v1/session');
        expect(getRes.body.language).toBe('en');

        const user = await prisma.user.findUnique({ where: { username: 'alice' } });
        expect(user.language).toBe('en');
    });

    it('DELETE /session logs out and invalidates the session', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const logoutRes = await agent.delete('/api/v1/session');
        expect(logoutRes.status).toBe(200);
        expect(logoutRes.body).toEqual({ username: 'alice' });

        const afterLogout = await agent.get('/api/v1/session');
        expect(afterLogout.status).toBe(401);
    });
});

describe('login rate limiter', () => {
    // The shared `app` skips this limiter under NODE_ENV=test (every other test in this
    // suite logs in repeatedly and would blow through a 10-req/15min quota almost
    // immediately). We verify the real, non-skipped limiter behavior on a throwaway
    // mini-app that mounts the exact same middleware factory used in app.js.
    it('returns 429 JSON after exceeding the 10-attempts/15min limit', async () => {
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.post('/api/v1/session', createLoginLimiter(), (req, res) => {
            res.json({ ok: true });
        });

        let lastRes;
        for (let i = 0; i < 11; i += 1) {
            lastRes = await request(miniApp).post('/api/v1/session').send({});
        }

        expect(lastRes.status).toBe(429);
        expect(lastRes.body).toEqual({ error: 'rate-limited' });
    });
});

describe('register rate limiter (D2)', () => {
    // 同 login 限流：共享 app 在 test 环境跳过，这里用 mini-app 验证真实限流行为。
    it('returns 429 JSON after exceeding the 20-attempts/hour limit', async () => {
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.post('/api/v1/users', createRegisterLimiter(), (req, res) => {
            res.json({ ok: true });
        });

        let lastRes;
        for (let i = 0; i < 21; i += 1) {
            lastRes = await request(miniApp).post('/api/v1/users').send({});
        }

        expect(lastRes.status).toBe(429);
        expect(lastRes.body).toEqual({ error: 'rate-limited' });
    });
});

describe('session security (D3/D4)', () => {
    it('rejects a non-string username with 401, not 500 (L1)', async () => {
        const res = await request(app)
            .post('/api/v1/session')
            .send({ username: { not: '' }, password: 'password1' });
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'user-not-registered' });
    });

    it('rejects a request whose session has expired', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        // 直接把该 session 的过期时间改到过去
        await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

        const res = await agent.get('/api/v1/session');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'auth-missing' });
    });

    it('cleanupExpiredSessions deletes only expired rows', async () => {
        // 一个有效 session（登录）+ 手动插一条过期 session
        await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const alice = await prisma.user.findUnique({ where: { username: 'alice' } });
        await prisma.session.create({
            data: {
                sid: 'expired-sid',
                userId: alice.id,
                expiresAt: new Date(Date.now() - 1000)
            }
        });

        const before = await prisma.session.count();
        expect(before).toBe(2);

        const removed = await cleanupExpiredSessions();
        expect(removed).toBe(1);

        const after = await prisma.session.count();
        expect(after).toBe(1); // 有效的那条还在
    });
});
