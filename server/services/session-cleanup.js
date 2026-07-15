// 清理过期 Session，防止 sessions 表随登录累积无限增长。
// 由午夜任务调度（见 server.js）。
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

export async function cleanupExpiredSessions() {
    const { count } = await prisma.session.deleteMany({
        where: { expiresAt: { lt: new Date() } }
    });
    logger.info({ count }, 'expired session cleanup complete');
    return count;
}
