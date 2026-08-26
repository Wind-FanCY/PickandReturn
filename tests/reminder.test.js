import { describe, it, expect } from 'vitest';
import app from '../app.js';
import prisma from '../lib/prisma.js';
import { registerAndLogin } from './helpers.js';
import { runAutoReminder } from '../server/services/reminder.js';

const ITEM_INFO = {
    itemDetail: 'A used bicycle',
    borrower: 'bob',
    lentDate: '2020-01-01',
    backDate: '2020-02-01'
};

// backDate 早已过期，制造午夜扫描的候选 item。
async function setupOverdueItem() {
    const lender = await registerAndLogin(app, { username: 'alice', password: 'password1' });
    const borrower = await registerAndLogin(app, { username: 'bob', password: 'password1' });
    const createRes = await lender.agent.post('/api/v1/items').send({ itemInfo: ITEM_INFO });
    return { lender, borrower, id: createRes.body.id };
}

describe('runAutoReminder: recipient follows the bottleneck party (Q5)', () => {
    it('pending items remind the borrower', async () => {
        const { lender, borrower } = await setupOverdueItem();

        const dueCount = await runAutoReminder();
        expect(dueCount).toBe(1);

        const borrowerNotifs = await borrower.agent.get('/api/v1/notifications');
        const reminders = borrowerNotifs.body.notifications.filter((n) => n.type === 'return_reminder');
        expect(reminders).toHaveLength(1);
        expect(reminders[0].message).toContain('提醒您归还物品');

        const lenderNotifs = await lender.agent.get('/api/v1/notifications');
        expect(lenderNotifs.body.notifications.filter((n) => n.type === 'return_reminder')).toHaveLength(0);
    });

    it('requested items remind the lender instead', async () => {
        const { lender, borrower, id } = await setupOverdueItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);

        const dueCount = await runAutoReminder();
        expect(dueCount).toBe(1);

        const lenderNotifs = await lender.agent.get('/api/v1/notifications');
        const reminders = lenderNotifs.body.notifications.filter((n) => n.type === 'return_reminder');
        expect(reminders).toHaveLength(1);
        expect(reminders[0].message).toContain('请确认收到');

        const borrowerNotifs = await borrower.agent.get('/api/v1/notifications');
        expect(borrowerNotifs.body.notifications.filter((n) => n.type === 'return_reminder')).toHaveLength(0);
    });

    it('does not remind confirmed items', async () => {
        const { lender, borrower, id } = await setupOverdueItem();
        await borrower.agent.post(`/api/v1/items/${id}/request-return`);
        await lender.agent.post(`/api/v1/items/${id}/confirm-return`);

        const dueCount = await runAutoReminder();
        expect(dueCount).toBe(0);
    });

    it('reminder convergence: re-running after resetting lastAutoReminderDate replaces the stale reminder', async () => {
        const { id } = await setupOverdueItem();

        await runAutoReminder();
        const borrowerUser = await prisma.user.findUnique({ where: { username: 'bob' } });
        const firstRound = await prisma.notification.findMany({
            where: { relatedItemId: id, userId: borrowerUser.id, type: 'return_reminder' }
        });
        expect(firstRound).toHaveLength(1);

        // 模拟第二天再次扫描：清掉 lastAutoReminderDate 的同日去重标记
        await prisma.item.update({ where: { id }, data: { lastAutoReminderDate: null } });
        await runAutoReminder();

        const secondRound = await prisma.notification.findMany({
            where: { relatedItemId: id, userId: borrowerUser.id, type: 'return_reminder' }
        });
        expect(secondRound).toHaveLength(1);
    });
});
