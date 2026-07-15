import { describe, it, expect } from 'vitest';
import { registerAndLogin } from './helpers.js';
import app from '../app.js';

const ITEM_INFO = {
    itemDetail: 'A used bicycle',
    borrower: 'bob',
    lentDate: '2026-07-01',
    backDate: '2026-08-01'
};

async function setupLenderAndBorrower() {
    const lender = await registerAndLogin(app, { username: 'alice', password: 'password1' });
    const borrower = await registerAndLogin(app, { username: 'bob', password: 'password1' });
    return { lender, borrower };
}

describe('POST /api/v1/items', () => {
    it('creates an item with default modifyLimit=3', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            itemDetail: 'A used bicycle',
            lentDate: '2026-07-01',
            backDate: '2026-08-01',
            returnStatus: 'pending',
            modifyLimit: 3,
            modifyRemaining: 3,
            lender: { username: 'alice' },
            borrower: { username: 'bob' }
        });
        expect(res.body.id).toBeTruthy();
    });

    it('rejects missing fields', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, itemDetail: undefined } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-item' });
    });

    it('rejects lending to yourself', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'alice' } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'bad-request' });
    });

    it('rejects a borrower that does not exist', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'nobody' } });
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'userNotExist' });
    });

    it('rejects "demo" as a borrower', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 'demo' } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'bad-request' });
    });

    // M1 回归：非字符串 borrower 不能触发 500（曾在 .toLowerCase() 处崩）
    it('rejects a non-string borrower with 400, not 500', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, borrower: 123 } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-item' });
    });

    // M2 回归：非法日期返回 400，不再是 Prisma 抛出的 500
    it('rejects an invalid date with 400, not 500', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, backDate: 'not-a-date' } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'bad-request' });
    });
});

describe('GET /api/v1/items', () => {
    it('only returns items where the caller is lender or borrower', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const { agent: carolAgent } = await registerAndLogin(app, {
            username: 'carol',
            password: 'password1'
        });

        await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });

        const lenderRes = await lender.agent.get('/api/v1/items');
        expect(Object.keys(lenderRes.body)).toHaveLength(1);

        const borrowerRes = await borrower.agent.get('/api/v1/items');
        expect(Object.keys(borrowerRes.body)).toHaveLength(1);

        const carolRes = await carolAgent.get('/api/v1/items');
        expect(Object.keys(carolRes.body)).toHaveLength(0);
    });
});

describe('item edit permissions (PUT /api/v1/items/:id)', () => {
    it('allows the lender to edit', async () => {
        const { lender } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await lender.agent
            .put(`/api/v1/items/${id}`)
            .send({ itemDetail: 'A newer bicycle', backDate: '2026-09-01' });

        expect(res.status).toBe(200);
        expect(res.body.itemDetail).toBe('A newer bicycle');
        expect(res.body.backDate).toBe('2026-09-01');
    });

    it('forbids the borrower from editing', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await borrower.agent.put(`/api/v1/items/${id}`).send({ itemDetail: 'Nope' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });
});

describe('DELETE /api/v1/items/:id', () => {
    it('forbids the borrower from deleting', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await borrower.agent.delete(`/api/v1/items/${id}`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('allows the lender to delete a pending item', async () => {
        const { lender } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await lender.agent.delete(`/api/v1/items/${id}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: `item ${id} deleted` });
    });

    it('forbids deleting a confirmed item', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        await lender.agent.post(`/api/v1/items/${id}/confirm-return`);

        const res = await lender.agent.delete(`/api/v1/items/${id}`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });
});

// H3 回归：confirmed 是只读历史，edit/modifylimit 不能再改；duedate 只能在 pending 阶段
describe('confirmed items are read-only (H3)', () => {
    async function setupConfirmedItem() {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        await lender.agent.post(`/api/v1/items/${id}/confirm-return`);
        return { lender, borrower, id };
    }

    it('forbids editing a confirmed item', async () => {
        const { lender, id } = await setupConfirmedItem();
        const res = await lender.agent.put(`/api/v1/items/${id}`).send({ itemDetail: 'tampered' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('forbids changing modifyLimit on a confirmed item', async () => {
        const { lender, id } = await setupConfirmedItem();
        const res = await lender.agent.patch(`/api/v1/items/${id}/modifylimit`).send({ modifyLimit: 5 });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('forbids the borrower changing due date once past pending (requested/confirmed)', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;
        await borrower.agent.post(`/api/v1/items/${id}/request-return`); // -> requested

        const res = await borrower.agent
            .patch(`/api/v1/items/${id}/duedate`)
            .send({ backDate: '2026-12-01' });
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });
});

describe('PATCH /api/v1/items/:id/duedate', () => {
    it('decrements modifyRemaining on each successful modification', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, modifyLimit: 2 } });
        const id = createRes.body.id;

        const first = await borrower.agent
            .patch(`/api/v1/items/${id}/duedate`)
            .send({ backDate: '2026-08-10' });
        expect(first.status).toBe(200);
        expect(first.body.modifyRemaining).toBe(1);
        expect(first.body.backDate).toBe('2026-08-10');

        const second = await borrower.agent
            .patch(`/api/v1/items/${id}/duedate`)
            .send({ backDate: '2026-08-15' });
        expect(second.status).toBe(200);
        expect(second.body.modifyRemaining).toBe(0);
    });

    it('rejects further modification once the limit is exhausted', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, modifyLimit: 1 } });
        const id = createRes.body.id;

        await borrower.agent.patch(`/api/v1/items/${id}/duedate`).send({ backDate: '2026-08-10' });
        const res = await borrower.agent
            .patch(`/api/v1/items/${id}/duedate`)
            .send({ backDate: '2026-08-20' });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('never decrements when modifyLimit is -1 (unlimited)', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, modifyLimit: -1 } });
        const id = createRes.body.id;

        for (let i = 0; i < 5; i += 1) {
            const res = await borrower.agent
                .patch(`/api/v1/items/${id}/duedate`)
                .send({ backDate: '2026-08-10' });
            expect(res.status).toBe(200);
            expect(res.body.modifyRemaining).toBe(-1);
        }
    });

    it('requires a backDate in the body', async () => {
        const { lender, borrower } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await borrower.agent.patch(`/api/v1/items/${id}/duedate`).send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'required-backDate' });
    });
});

describe('PATCH /api/v1/items/:id/modifylimit', () => {
    it('lets the lender set a new limit and resets modifyRemaining', async () => {
        const { lender } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await lender.agent.patch(`/api/v1/items/${id}/modifylimit`).send({ modifyLimit: 5 });
        expect(res.status).toBe(200);
        expect(res.body.modifyLimit).toBe(5);
        expect(res.body.modifyRemaining).toBe(5);
    });

    it('rejects invalid modifyLimit values', async () => {
        const { lender } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const res = await lender.agent.patch(`/api/v1/items/${id}/modifylimit`).send({ modifyLimit: -2 });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'invalid-modifyLimit' });
    });
});

describe('security hardening (Phase D)', () => {
    it('rejects itemDetail longer than the max length (M2)', async () => {
        const { lender } = await setupLenderAndBorrower();
        const res = await lender.agent
            .post('/api/v1/items')
            .send({ itemInfo: { ...ITEM_INFO, itemDetail: 'x'.repeat(201) } });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'bad-request' });
    });

    it('enforces a cooldown between manual reminders on the same item (M1)', async () => {
        const { lender } = await setupLenderAndBorrower();
        const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
        const id = createRes.body.id;

        const first = await lender.agent.post(`/api/v1/items/${id}/remind`);
        expect(first.status).toBe(200);

        const second = await lender.agent.post(`/api/v1/items/${id}/remind`);
        expect(second.status).toBe(429);
        expect(second.body).toEqual({ error: 'rate-limited' });
    });
});
