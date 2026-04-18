import express from 'express';
import cookieParser from 'cookie-parser';
import sessionControllor from './server/controllers/session-controller.js';
import itemController from './server/controllers/item-controller.js';
import userController from './server/controllers/user-controller.js';
import notificationController from './server/controllers/notification-controller.js';
import users from './server/models/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('./dist'));
app.use(express.json());

app.post('/api/v1/users', userController.register);

app.get('/api/v1/session', sessionControllor.getSession);
app.post('/api/v1/session', sessionControllor.login);
app.patch('/api/v1/session', sessionControllor.patchSession);
app.delete('/api/v1/session', sessionControllor.logout);

app.get('/api/v1/items', itemController.getItemsList);
app.post('/api/v1/items', itemController.addItem);
app.post('/api/v1/items/:id', itemController.sendNotice);
app.patch('/api/v1/items/:id', itemController.updateItem);
app.delete('/api/v1/items/:id', itemController.deleteItem);
app.put('/api/v1/items/:id', itemController.editItem);
app.patch('/api/v1/items/:id/duedate', itemController.modifyDueDate);
app.patch('/api/v1/items/:id/modifylimit', itemController.updateModifyLimit);

// NOTE: /notifications/read must be registered before /notifications/:id
// to prevent Express treating "read" as an :id parameter
app.get('/api/v1/notifications', notificationController.getNotifications);
app.patch('/api/v1/notifications/read', notificationController.markAllRead);
app.delete('/api/v1/notifications/:id', notificationController.deleteNotification);

// Midnight auto-reminder job
function runAutoReminder() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const allUsernames = users.getAllUsers();
    allUsernames.forEach(function(username) {
        const itemsList = users.getUserItemsList(username);
        if (!itemsList) return;
        const items = itemsList.getItems();
        Object.values(items).forEach(function(item) {
            if (
                item.lender === username &&
                item.backDate === today &&
                item.returned === false &&
                item.lastAutoReminderDate !== today
            ) {
                const borrowerNotifs = users.getUserNotifications(item.borrower);
                if (borrowerNotifs) {
                    borrowerNotifs.add(
                        'return_reminder',
                        `${item.lender} 提醒您归还物品：${item.itemDetail}，应还日期 ${item.backDate}`,
                        item.id
                    );
                }
                itemsList.updateLastReminderDate(item.id, today);
            }
        });
    });
}

function scheduleMidnightJob() {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;
    setTimeout(function() {
        runAutoReminder();
        setInterval(runAutoReminder, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

scheduleMidnightJob();

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});
