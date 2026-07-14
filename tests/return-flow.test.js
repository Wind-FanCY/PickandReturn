import { describe, it, expect } from 'vitest';
import { registerAndLogin } from './helpers.js';
import app from '../app.js';

const ITEM_INFO = {
    itemDetail: 'A used bicycle',
    borrower: 'bob',
    lentDate: '2026-07-01',
    backDate: '2026-08-01'
};

async function setupItem() {
    const lender = await registerAndLogin(app, { username: 'alice', password: 'password1' });
    const borrower = await registerAndLogin(app, { username: 'bob', password: 'password1' });
    const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
    return { lender, borrower, id: createRes.body.id };
}

describe('return flow: pending -> requested -> confirmed', () => {
    it('runs the full happy path and generates notifications for both sides', async () => {
        const { lender, borrower, id } = await setupItem();

        const requestRes = await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        expect(requestRes.status).toBe(200);
        expect(requestRes.body.returnStatus).toBe('requested');
        expect(requestRes.body.returnedAt).toBeTruthy();

        const lenderNotifs = await lender.agent.get('/api/v1/notifications');
        expect(lenderNotifs.body.notifications).toHaveLength(1);
        expect(lenderNotifs.body.notifications[0].type).toBe('return_requested');

        const confirmRes = await lender.agent.post(`/api/v1/items/${id}/confirm-return`);
        expect(confirmRes.status).toBe(200);
        expect(confirmRes.body.returnStatus).toBe('confirmed');
        expect(confirmRes.body.confirmedAt).toBeTruthy();

        const borrowerNotifs = await borrower.agent.get('/api/v1/notifications');
        expect(borrowerNotifs.body.notifications).toHaveLength(1);
        expect(borrowerNotifs.body.notifications[0].type).toBe('return_confirmed');
    });

    it('rejects request-return from the lender (only borrower may trigger it)', async () => {
        const { lender, id } = await setupItem();
        const res = await lender.agent.post(`/api/v1/items/${id}/request-return`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('rejects a second request-return once already requested', async () => {
        const { borrower, id } = await setupItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        const res = await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'invalid-state' });
    });

    it('rejects confirm-return from the borrower (only lender may trigger it)', async () => {
        const { borrower, id } = await setupItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        const res = await borrower.agent.post(`/api/v1/items/${id}/confirm-return`);
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('rejects confirm-return while the item is still pending', async () => {
        const { lender, id } = await setupItem();
        const res = await lender.agent.post(`/api/v1/items/${id}/confirm-return`);
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'invalid-state' });
    });

    it('rejects a second confirm-return once already confirmed', async () => {
        const { lender, borrower, id } = await setupItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        await lender.agent.post(`/api/v1/items/${id}/confirm-return`);
        const res = await lender.agent.post(`/api/v1/items/${id}/confirm-return`);
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: 'invalid-state' });
    });

    // H1 回归：并发/双击 request-return 不能产生重复通知（状态守卫在事务内原子完成）
    it('concurrent double-submit of request-return yields one success + one 409, single notification', async () => {
        const { lender, borrower, id } = await setupItem();
        const [r1, r2] = await Promise.all([
            borrower.agent.post(`/api/v1/items/${id}/request-return`),
            borrower.agent.post(`/api/v1/items/${id}/request-return`)
        ]);
        expect([r1.status, r2.status].sort()).toEqual([200, 409]);

        const lenderNotifs = await lender.agent.get('/api/v1/notifications');
        expect(lenderNotifs.body.notifications).toHaveLength(1);
        expect(lenderNotifs.body.notifications[0].type).toBe('return_requested');
    });

    // H1 回归：并发/双击 confirm-return 同理
    it('concurrent double-submit of confirm-return yields one success + one 409, single notification', async () => {
        const { lender, borrower, id } = await setupItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        const [r1, r2] = await Promise.all([
            lender.agent.post(`/api/v1/items/${id}/confirm-return`),
            lender.agent.post(`/api/v1/items/${id}/confirm-return`)
        ]);
        expect([r1.status, r2.status].sort()).toEqual([200, 409]);

        const borrowerNotifs = await borrower.agent.get('/api/v1/notifications');
        const confirmed = borrowerNotifs.body.notifications.filter((n) => n.type === 'return_confirmed');
        expect(confirmed).toHaveLength(1);
    });
});
