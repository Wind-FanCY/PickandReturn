import { describe, it, expect } from 'vitest';
import app from '../app.js';
import prisma from '../lib/prisma.js';
import { registerAndLogin, login } from './helpers.js';

describe('POST /api/v1/users/me/password', () => {
    it('rejects the wrong old password', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent
            .post('/api/v1/users/me/password')
            .send({ oldPassword: 'wrong', newPassword: 'newpassword1' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'wrong-password' });
    });

    it('rejects a new password shorter than 6 characters', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent
            .post('/api/v1/users/me/password')
            .send({ oldPassword: 'password1', newPassword: '123' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-password' });
    });

    it('changes the password and flips mustChangePassword to false', async () => {
        // 模拟自动建号的借入方：mustChangePassword 起始为 true
        await prisma.user.create({
            data: {
                username: 'provisioned',
                passwordHash: (await import('bcrypt')).default.hashSync('initialpw1', 10),
                mustChangePassword: true
            }
        });
        const { agent, res: loginRes } = await login(app, { username: 'provisioned', password: 'initialpw1' });
        expect(loginRes.body.mustChangePassword).toBe(true);

        const res = await agent
            .post('/api/v1/users/me/password')
            .send({ oldPassword: 'initialpw1', newPassword: 'brandnewpw1' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });

        // 旧密码失效，新密码生效
        const oldLoginRes = await login(app, { username: 'provisioned', password: 'initialpw1' });
        expect(oldLoginRes.res.status).toBe(401);

        const newLoginRes = await login(app, { username: 'provisioned', password: 'brandnewpw1' });
        expect(newLoginRes.res.status).toBe(200);
        expect(newLoginRes.res.body.mustChangePassword).toBe(false);
    });

    it('requires authentication', async () => {
        const res = await (await import('supertest')).default(app)
            .post('/api/v1/users/me/password')
            .send({ oldPassword: 'x', newPassword: 'yyyyyy' });
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'auth-missing' });
    });
});
