import { describe, it, expect } from 'vitest';
import { registerAndLogin } from './helpers.js';
import app from '../app.js';

const ITEM_INFO = {
    itemDetail: 'A used bicycle',
    borrower: 'bob',
    lentDate: '2026-07-01',
    backDate: '2026-08-01'
};

async function setupItemWithReminder() {
    const lender = await registerAndLogin(app, { username: 'alice', password: 'password1' });
    const borrower = await registerAndLogin(app, { username: 'bob', password: 'password1' });
    const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
    const id = createRes.body.id;
    await lender.agent.post(`/api/v1/items/${id}/remind`);
    return { lender, borrower, id };
}

describe('GET /api/v1/notifications', () => {
    it('lists notifications for the current user only, newest first', async () => {
        const { borrower } = await setupItemWithReminder();
        const res = await borrower.agent.get('/api/v1/notifications');
        expect(res.status).toBe(200);
        expect(res.body.notifications).toHaveLength(1);
        expect(res.body.notifications[0].type).toBe('return_reminder');
        expect(res.body.notifications[0].read).toBe(false);
    });
});

describe('PATCH /api/v1/notifications/read', () => {
    it('marks all of the caller notifications as read', async () => {
        const { borrower } = await setupItemWithReminder();
        const res = await borrower.agent.patch('/api/v1/notifications/read');
        expect(res.status).toBe(200);
        expect(res.body.notifications.every((n) => n.read === true)).toBe(true);

        const after = await borrower.agent.get('/api/v1/notifications');
        expect(after.body.notifications.every((n) => n.read === true)).toBe(true);
    });
});

describe('DELETE /api/v1/notifications/:id', () => {
    it('deletes the caller own notification', async () => {
        const { borrower } = await setupItemWithReminder();
        const listRes = await borrower.agent.get('/api/v1/notifications');
        const notificationId = listRes.body.notifications[0].id;

        const res = await borrower.agent.delete(`/api/v1/notifications/${notificationId}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'deleted' });

        const after = await borrower.agent.get('/api/v1/notifications');
        expect(after.body.notifications).toHaveLength(0);
    });

    it('rejects deleting another user notification', async () => {
        const { lender, borrower } = await setupItemWithReminder();
        const listRes = await borrower.agent.get('/api/v1/notifications');
        const notificationId = listRes.body.notifications[0].id;

        const res = await lender.agent.delete(`/api/v1/notifications/${notificationId}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'not-found' });
    });

    it('returns 404 for a notification that does not exist', async () => {
        const { borrower } = await setupItemWithReminder();
        const res = await borrower.agent.delete('/api/v1/notifications/does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'not-found' });
    });
});
