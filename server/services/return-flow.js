// 归还三态流程的事务逻辑：pending -> requested -> confirmed。
// 状态守卫下推到 SQL：在同一事务内用条件 updateMany（where 带上当前应有状态），
// 只有 count === 1 才创建通知，否则视为竞态/非法转移，返回 null（controller 转 409）。
// 这样"读+判断+写"合并成一次原子的条件更新，杜绝并发双击产生重复通知。
import prisma from '../../lib/prisma.js';

const ITEM_INCLUDE = { lender: true, borrower: true };

// 借阅方触发：pending -> requested，通知出借方。
// `item` 需已 include lender/borrower（用于通知文案 + userId）。
// 返回更新后的 item；若并发竞态导致状态已变（count 0）返回 null。
export async function requestReturn(item) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
        const { count } = await tx.item.updateMany({
            where: { id: item.id, returnStatus: 'pending' },
            data: { returnStatus: 'requested', returnedAt: now }
        });
        if (count === 0) return null;

        await tx.notification.create({
            data: {
                type: 'return_requested',
                message: `${item.borrower.username} 已归还物品：${item.itemDetail}，请确认收到`,
                userId: item.lenderId,
                relatedItemId: item.id
            }
        });
        return tx.item.findUnique({ where: { id: item.id }, include: ITEM_INCLUDE });
    });
}

// 出借方触发：requested -> confirmed，通知借阅方。
export async function confirmReturn(item) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
        const { count } = await tx.item.updateMany({
            where: { id: item.id, returnStatus: 'requested' },
            data: { returnStatus: 'confirmed', confirmedAt: now }
        });
        if (count === 0) return null;

        await tx.notification.create({
            data: {
                type: 'return_confirmed',
                message: `${item.lender.username} 已确认收到归还：${item.itemDetail}`,
                userId: item.borrowerId,
                relatedItemId: item.id
            }
        });
        return tx.item.findUnique({ where: { id: item.id }, include: ITEM_INCLUDE });
    });
}
