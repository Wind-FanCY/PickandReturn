import { randomUUID as uuid } from 'crypto';

function makeNotificationsList(userId) {
    const notifications = {};

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    function isWithinSevenDays(createdAt) {
        return (new Date() - new Date(createdAt)) < SEVEN_DAYS_MS;
    }

    function add(type, message, relatedItemId) {
        const id = uuid();
        const notif = {
            id,
            type,
            message,
            read: false,
            userId,
            relatedItemId,
            createdAt: new Date()
        };
        notifications[id] = notif;
        return notif;
    }

    function getAll() {
        return Object.values(notifications).filter(function(n) {
            return isWithinSevenDays(n.createdAt);
        });
    }

    function markAllRead() {
        const result = getAll();
        result.forEach(function(n) {
            notifications[n.id].read = true;
        });
        return result.map(function(n) {
            return Object.assign({}, n, { read: true });
        });
    }

    function deleteNotification(id) {
        if (!notifications[id]) {
            return false;
        }
        delete notifications[id];
        return true;
    }

    function getUnreadCount() {
        return getAll().filter(function(n) {
            return !n.read;
        }).length;
    }

    return {
        add,
        getAll,
        markAllRead,
        delete: deleteNotification,
        getUnreadCount
    };
}

export default {
    makeNotificationsList
};
