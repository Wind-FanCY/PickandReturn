// 把 Prisma Item（含 lender/borrower include）序列化成统一的 API 响应形状。
// date-only 字段（lentDate/backDate/lastAutoReminderDate）序列化成 'YYYY-MM-DD'，不带时分秒。

export function formatDateOnly(date) {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
}

export function serializeItem(item) {
    return {
        id: item.id,
        itemDetail: item.itemDetail,
        lentDate: formatDateOnly(item.lentDate),
        backDate: formatDateOnly(item.backDate),
        returnStatus: item.returnStatus,
        returnedAt: item.returnedAt,
        confirmedAt: item.confirmedAt,
        modifyLimit: item.modifyLimit,
        modifyRemaining: item.modifyRemaining,
        lastAutoReminderDate: formatDateOnly(item.lastAutoReminderDate),
        createdAt: item.createdAt,
        lender: { username: item.lender.username },
        borrower: { username: item.borrower.username }
    };
}
