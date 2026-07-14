import prisma from '../../lib/prisma.js';

async function getNotifications(req, res) {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
}

async function markAllRead(req, res) {
    await prisma.notification.updateMany({
        where: { userId: req.userId },
        data: { read: true }
    });

    const notifications = await prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
}

async function deleteNotification(req, res) {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.userId) {
        res.status(404).json({ error: 'not-found' });
        return;
    }

    await prisma.notification.delete({ where: { id } });
    res.json({ message: 'deleted' });
}

export default {
    getNotifications,
    markAllRead,
    deleteNotification
};
