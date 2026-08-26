// 午夜自动提醒扫描：backDate < today && returnStatus !== 'confirmed' 的 Item。
// 接收人按状态（瓶颈方）分流：pending -> 借阅方（还没还）；requested -> 出借方（还没确认）。
// 每条提醒走"提醒收敛"：同一 item + 接收人只保留最新一条 return_reminder（先删后建）。
// lastAutoReminderDate 记录在 item 上，防止同日重复扫描重复提醒。
import prisma from '../../lib/prisma.js';
import logger from '../../lib/logger.js';
import { formatDateOnly } from './item-presenter.js';

function todayDateOnly() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// 根据 item 当前状态决定提醒接收人 + 消息文案。
function buildReminder(item) {
    if (item.returnStatus === 'pending') {
        return {
            recipientId: item.borrowerId,
            message: `${item.lender.username} 提醒您归还物品：${item.itemDetail}，应还日期 ${formatDateOnly(item.backDate)}`
        };
    }
    if (item.returnStatus === 'requested') {
        return {
            recipientId: item.lenderId,
            message: `${item.borrower.username} 已归还《${item.itemDetail}》，请确认收到`
        };
    }
    return null;
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
        const reminder = buildReminder(item);
        if (!reminder) continue;

        await prisma.$transaction([
            prisma.item.update({
                where: { id: item.id },
                data: { lastAutoReminderDate: today }
            }),
            prisma.notification.deleteMany({
                where: { relatedItemId: item.id, userId: reminder.recipientId, type: 'return_reminder' }
            }),
            prisma.notification.create({
                data: {
                    type: 'return_reminder',
                    message: reminder.message,
                    userId: reminder.recipientId,
                    relatedItemId: item.id
                }
            })
        ]);
    }

    logger.info({ count: due.length }, 'auto reminder scan complete');
    return due.length;
}
