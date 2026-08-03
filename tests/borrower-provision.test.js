import { describe, it, expect } from 'vitest';
import app from '../app.js';
import prisma from '../lib/prisma.js';
import { registerAndLogin, login } from './helpers.js';
import { provisionBorrowerAndItem } from '../server/services/borrower-provision.js';

const ITEM_INFO = {
    itemDetail: 'A used bicycle',
    borrower: 'newguy',
    lentDate: '2026-07-01',
    backDate: '2026-08-01'
};

describe('POST /api/v1/items with createBorrower (auto-provision borrower account)', () => {
    it('creates a new borrower account + item, returning borrowerCredentials', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });

        const res = await agent
            .post('/api/v1/items')
            .send({ itemInfo: ITEM_INFO, createBorrower: true });

        expect(res.status).toBe(201);
        expect(res.body.item).toMatchObject({
            itemDetail: 'A used bicycle',
            lender: { username: 'alice' },
            borrower: { username: 'newguy', mustChangePassword: true }
        });
        expect(res.body.borrowerCredentials.username).toBe('newguy');
        expect(typeof res.body.borrowerCredentials.initialPassword).toBe('string');
        expect(res.body.borrowerCredentials.initialPassword.length).toBe(12);

        // 新账号确实建好了，且 mustChangePassword=true
        const newUser = await prisma.user.findUnique({ where: { username: 'newguy' } });
        expect(newUser).not.toBeNull();
        expect(newUser.mustChangePassword).toBe(true);

        // 生成的初始密码真的能登录
        const loginRes = await login(app, {
            username: 'newguy',
            password: res.body.borrowerCredentials.initialPassword
        });
        expect(loginRes.res.status).toBe(200);
        expect(loginRes.res.body.mustChangePassword).toBe(true);
    });

    it('still returns 404 userNotExist when createBorrower is not set', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'userNotExist' });
    });

    it('rejects an invalid username format', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'no way' }, createBorrower: true });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-username' });
    });

    it('rejects a username containing a sensitive word', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'fuckyou' }, createBorrower: true });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'sensitive-content' });
    });

    it('rejects the reserved username "dog"', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'dog' }, createBorrower: true });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'auth-insufficient' });
    });

    it('returns 409 user-already-exists on a unique constraint race', async () => {
        await prisma.user.create({
            data: { username: 'raceduser', passwordHash: 'x' }
        });

        await expect(
            provisionBorrowerAndItem({
                username: 'raceduser',
                itemData: {
                    itemDetail: 'x',
                    lentDate: new Date('2026-07-01'),
                    backDate: new Date('2026-08-01'),
                    modifyLimit: 3,
                    modifyRemaining: 3,
                    lenderId: 'does-not-matter'
                }
            })
        ).rejects.toMatchObject({ code: 'P2002' });
    });
});

describe('POST /api/v1/items/:id/reset-borrower-password', () => {
    async function setupProvisionedItem() {
        const { agent: lenderAgent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const createRes = await lenderAgent
            .post('/api/v1/items')
            .send({ itemInfo: ITEM_INFO, createBorrower: true });
        return { lenderAgent, id: createRes.body.item.id };
    }

    it('forbids a non-lender from resetting the password', async () => {
        const { id } = await setupProvisionedItem();
        const { agent: strangerAgent } = await registerAndLogin(app, {
            username: 'stranger',
            password: 'password1'
        });

        const res = await strangerAgent.post(`/api/v1/items/${id}/reset-borrower-password`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('forbids resetting once the borrower has taken over the account', async () => {
        const { lenderAgent, id } = await setupProvisionedItem();
        await prisma.user.update({ where: { username: 'newguy' }, data: { mustChangePassword: false } });

        const res = await lenderAgent.post(`/api/v1/items/${id}/reset-borrower-password`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('lets the lender regenerate the initial password while unclaimed', async () => {
        const { lenderAgent, id } = await setupProvisionedItem();

        const res = await lenderAgent.post(`/api/v1/items/${id}/reset-borrower-password`);
        expect(res.status).toBe(200);
        expect(res.body.borrowerCredentials.username).toBe('newguy');
        expect(typeof res.body.borrowerCredentials.initialPassword).toBe('string');

        const loginRes = await login(app, {
            username: 'newguy',
            password: res.body.borrowerCredentials.initialPassword
        });
        expect(loginRes.res.status).toBe(200);

        // mustChangePassword 保持 true
        const user = await prisma.user.findUnique({ where: { username: 'newguy' } });
        expect(user.mustChangePassword).toBe(true);
    });

    it('404s when the item does not exist', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const res = await agent.post('/api/v1/items/does-not-exist/reset-borrower-password');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'item-missing' });
    });
});
