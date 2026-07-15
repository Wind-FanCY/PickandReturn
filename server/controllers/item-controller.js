import prisma from '../../lib/prisma.js';
import { serializeItem, formatDateOnly } from '../services/item-presenter.js';
import { requestReturn as requestReturnService, confirmReturn as confirmReturnService } from '../services/return-flow.js';
import { MODIFY_UNLIMITED, DEFAULT_MODIFY_LIMIT, MAX_ITEM_DETAIL_LENGTH, REMIND_COOLDOWN_MS } from '../constants.js';

const ITEM_INCLUDE = { lender: true, borrower: true };

// 把输入解析成合法 Date，非法（含 undefined/乱码）返回 null，供调用方转 400。
function parseDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

async function getItemsList(req, res) {
    const items = await prisma.item.findMany({
        where: { OR: [{ lenderId: req.userId }, { borrowerId: req.userId }] },
        include: ITEM_INCLUDE
    });

    const itemsMap = {};
    items.forEach((item) => {
        itemsMap[item.id] = serializeItem(item);
    });
    res.json(itemsMap);
}

async function addItem(req, res) {
    const { itemInfo } = req.body || {};
    const { itemDetail, borrower, lentDate, backDate, modifyLimit } = itemInfo || {};

    if (!itemDetail || typeof itemDetail !== 'string' || typeof borrower !== 'string' || !borrower || !lentDate || !backDate) {
        res.status(400).json({ error: 'required-item' });
        return;
    }

    if (itemDetail.length > MAX_ITEM_DETAIL_LENGTH) {
        res.status(400).json({ error: 'bad-request' });
        return;
    }

    const parsedLentDate = parseDate(lentDate);
    const parsedBackDate = parseDate(backDate);
    if (!parsedLentDate || !parsedBackDate) {
        res.status(400).json({ error: 'bad-request' });
        return;
    }

    if (borrower === req.username) {
        res.status(400).json({ error: 'bad-request' });
        return;
    }

    if (borrower.toLowerCase() === 'demo') {
        res.status(400).json({ error: 'bad-request' });
        return;
    }

    const borrowerUser = await prisma.user.findUnique({ where: { username: borrower } });
    if (!borrowerUser) {
        res.status(404).json({ error: 'userNotExist' });
        return;
    }

    const limit = modifyLimit !== undefined ? modifyLimit : DEFAULT_MODIFY_LIMIT;

    const item = await prisma.item.create({
        data: {
            itemDetail,
            lentDate: parsedLentDate,
            backDate: parsedBackDate,
            modifyLimit: limit,
            modifyRemaining: limit,
            lenderId: req.userId,
            borrowerId: borrowerUser.id
        },
        include: ITEM_INCLUDE
    });

    req.log.info({ itemId: item.id }, 'item created');
    res.status(201).json(serializeItem(item));
}

async function sendNotice(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id }, include: ITEM_INCLUDE });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.lenderId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // 提醒冷却：同一 item 一小时内只允许一次手动提醒，防止提醒轰炸（M1）
    const recentReminder = await prisma.notification.findFirst({
        where: {
            relatedItemId: item.id,
            type: 'return_reminder',
            createdAt: { gt: new Date(Date.now() - REMIND_COOLDOWN_MS) }
        }
    });
    if (recentReminder) {
        res.status(429).json({ error: 'rate-limited' });
        return;
    }

    const message = `${item.lender.username} 提醒您归还物品：${item.itemDetail}，应还日期 ${formatDateOnly(item.backDate)}`;
    const notification = await prisma.notification.create({
        data: {
            type: 'return_reminder',
            message,
            userId: item.borrowerId,
            relatedItemId: item.id
        }
    });

    res.json({ notification });
}

// 借阅方触发：pending -> requested
async function requestReturn(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id }, include: ITEM_INCLUDE });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.borrowerId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    if (item.returnStatus !== 'pending') {
        res.status(409).json({ error: 'invalid-state' });
        return;
    }

    const updated = await requestReturnService(item);
    if (!updated) {
        res.status(409).json({ error: 'invalid-state' });
        return;
    }
    res.json(serializeItem(updated));
}

// 出借方触发：requested -> confirmed
async function confirmReturn(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id }, include: ITEM_INCLUDE });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.lenderId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    if (item.returnStatus !== 'requested') {
        res.status(409).json({ error: 'invalid-state' });
        return;
    }

    const updated = await confirmReturnService(item);
    if (!updated) {
        res.status(409).json({ error: 'invalid-state' });
        return;
    }
    res.json(serializeItem(updated));
}

async function editItem(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.lenderId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // confirmed 属于历史记录，只读，不允许再编辑
    if (item.returnStatus === 'confirmed') {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { itemDetail, backDate, lentDate } = req.body || {};
    const data = {};
    if (itemDetail !== undefined) {
        if (typeof itemDetail !== 'string' || itemDetail.length > MAX_ITEM_DETAIL_LENGTH) {
            res.status(400).json({ error: 'bad-request' });
            return;
        }
        data.itemDetail = itemDetail;
    }
    if (backDate !== undefined) {
        const d = parseDate(backDate);
        if (!d) {
            res.status(400).json({ error: 'bad-request' });
            return;
        }
        data.backDate = d;
    }
    if (lentDate !== undefined) {
        const d = parseDate(lentDate);
        if (!d) {
            res.status(400).json({ error: 'bad-request' });
            return;
        }
        data.lentDate = d;
    }

    const updated = await prisma.item.update({ where: { id }, data, include: ITEM_INCLUDE });
    res.json(serializeItem(updated));
}

async function deleteItem(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.lenderId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // confirmed 的 Item 保留借还历史，不允许删除
    if (item.returnStatus === 'confirmed') {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    await prisma.item.delete({ where: { id } });
    res.json({ message: `item ${id} deleted` });
}

async function modifyDueDate(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id }, include: ITEM_INCLUDE });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.borrowerId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // 只有 pending 阶段借阅方才能改期；requested/confirmed 后操作按钮应禁用
    if (item.returnStatus !== 'pending') {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    if (item.modifyRemaining === 0 && item.modifyLimit !== MODIFY_UNLIMITED) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { backDate } = req.body || {};
    if (!backDate) {
        res.status(400).json({ error: 'required-backDate' });
        return;
    }

    const parsedBackDate = parseDate(backDate);
    if (!parsedBackDate) {
        res.status(400).json({ error: 'bad-request' });
        return;
    }

    const newRemaining =
        item.modifyLimit === MODIFY_UNLIMITED ? item.modifyRemaining : item.modifyRemaining - 1;

    const [updated] = await prisma.$transaction([
        prisma.item.update({
            where: { id },
            data: { backDate: parsedBackDate, modifyRemaining: newRemaining },
            include: ITEM_INCLUDE
        }),
        prisma.notification.create({
            data: {
                type: 'date_modified',
                message: `${item.borrower.username} 修改了归还日期：${item.itemDetail}，新日期 ${backDate}`,
                userId: item.lenderId,
                relatedItemId: id
            }
        })
    ]);

    res.json(serializeItem(updated));
}

async function updateModifyLimit(req, res) {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    if (item.lenderId !== req.userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    // confirmed 属于历史记录，只读，不允许再改修改次数
    if (item.returnStatus === 'confirmed') {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { modifyLimit } = req.body || {};
    const isValidLimit = modifyLimit === MODIFY_UNLIMITED || (Number.isInteger(modifyLimit) && modifyLimit >= 0);
    if (!isValidLimit) {
        res.status(400).json({ error: 'invalid-modifyLimit' });
        return;
    }

    const updated = await prisma.item.update({
        where: { id },
        data: { modifyLimit, modifyRemaining: modifyLimit },
        include: ITEM_INCLUDE
    });

    res.json(serializeItem(updated));
}

export default {
    getItemsList,
    addItem,
    sendNotice,
    requestReturn,
    confirmReturn,
    editItem,
    deleteItem,
    modifyDueDate,
    updateModifyLimit
};
