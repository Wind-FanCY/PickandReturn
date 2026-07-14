// 午夜自动提醒扫描：today > backDate && returnStatus !== 'confirmed' 的 Item，
// 向借阅方追加 return_reminder 通知，并记录 lastAutoReminderDate 防止同日重复提醒。
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { formatDateOnly } from './item-presenter.js';

function todayDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function runAutoReminder() {
    const today = todayDateOnly();

    const candidates = await prisma.item.findMany({
        where: {
            backDate: { lt: today },
            returnStatus: { not: 'confirmed' }
        },
        include: { lender: true, borrower: true }
    });

    const due = candidates.filter((item) => {
        if (!item.lastAutoReminderDate) return true;
        return item.lastAutoReminderDate.getTime() !== today.getTime();
    });

    for (const item of due) {
        await prisma.$transaction([
            prisma.item.update({
                where: { id: item.id },
                data: { lastAutoReminderDate: today }
            }),
            prisma.notification.create({
                data: {
                    type: 'return_reminder',
                    message: `${item.lender.username} 提醒您归还物品：${item.itemDetail}，应还日期 ${formatDateOnly(item.backDate)}`,
                    userId: item.borrowerId,
                    relatedItemId: item.id
                }
            })
        ]);
    }

    logger.info({ count: due.length }, 'auto reminder scan complete');
    return due.length;
}
