import { describe, it, expect } from 'vitest';
import prisma from '../lib/prisma.js';
import { registerAndLogin } from './helpers.js';
import app from '../app.js';
import { cleanupOldNotifications } from '../server/services/notification-cleanup.js';
import { NOTIFICATION_RETENTION_DAYS } from '../server/constants.js';

const RETENTION_MS = NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

describe('cleanupOldNotifications', () => {
    it('deletes notifications older than the retention window and keeps recent ones', async () => {
        const { agent } = await registerAndLogin(app, { username: 'alice', password: 'password1' });
        const sessionRes = await agent.get('/api/v1/session');
        const userId = (await prisma.user.findUnique({ where: { username: 'alice' } })).id;
        expect(sessionRes.status).toBe(200);

        const old = await prisma.notification.create({
            data: {
                type: 'date_modified',
                message: 'old notification',
                userId,
                createdAt: new Date(Date.now() - RETENTION_MS - 24 * 60 * 60 * 1000)
            }
        });
        const recent = await prisma.notification.create({
            data: {
                type: 'date_modified',
                message: 'recent notification',
                userId,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        });

        const deletedCount = await cleanupOldNotifications();
        expect(deletedCount).toBe(1);

        const remaining = await prisma.notification.findMany({ where: { userId } });
        expect(remaining.map((n) => n.id)).toEqual([recent.id]);
        expect(remaining.map((n) => n.id)).not.toContain(old.id);
    });
});
