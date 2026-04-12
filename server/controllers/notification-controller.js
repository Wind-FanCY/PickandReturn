import sessions from "../models/sessions.js";
import users from "../models/users.js";

function getNotifications(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const userNotifs = users.getUserNotifications(username);
    if (!userNotifs) {
        res.status(404).json({ error: 'user-not-found' });
        return;
    }

    res.json({ notifications: userNotifs.getAll() });
}

function markAllRead(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const userNotifs = users.getUserNotifications(username);
    if (!userNotifs) {
        res.status(404).json({ error: 'user-not-found' });
        return;
    }

    const result = userNotifs.markAllRead();
    res.json({ notifications: result });
}

function deleteNotification(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const userNotifs = users.getUserNotifications(username);
    if (!userNotifs) {
        res.status(404).json({ error: 'user-not-found' });
        return;
    }

    const deleted = userNotifs.delete(id);
    if (!deleted) {
        res.status(404).json({ error: 'not-found' });
        return;
    }

    res.json({ message: 'deleted' });
}

export default {
    getNotifications,
    markAllRead,
    deleteNotification
};
