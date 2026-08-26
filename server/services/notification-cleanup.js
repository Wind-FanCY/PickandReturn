// 清理超过留存期的通知，防止 notifications 表无限增长。
// 不分读写，按 createdAt 一刀切。由午夜任务调度（见 server.js）。
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { NOTIFICATION_RETENTION_DAYS } from '../constants.js';

const RETENTION_MS = NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export async function cleanupOldNotifications() {
    const { count } = await prisma.notification.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } }
    });
    logger.info({ count }, 'old notification cleanup complete');
    return count;
}
