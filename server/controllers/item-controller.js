import sessions from "../models/sessions.js";
import users from "../models/users.js";

function getItemsList(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const itemsList = users.getUserData(username).getItems();
    res.json(itemsList);
}

function addItem(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { itemInfo } = req.body;
    const { itemDetail, lender, borrower, lentDate, backDate } = itemInfo;
    if (!itemDetail || !lender || !borrower || !lentDate || !backDate) {
        res.status(400).json({ error: 'required-item' });
        return;
    }

    const lenderItemsList = users.getUserData(username);
    const id = lenderItemsList.addLentItem(itemInfo);
    const newItem = lenderItemsList.getItem(id);

    // Write the item into the borrower's list as well (with the generated id)
    const borrowerItemsList = users.getUserItemsList(itemInfo.borrower);
    if (borrowerItemsList) {
        borrowerItemsList.addBorrowedItem(newItem);
    }

    res.json(newItem);
}

function sendNotice(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const lenderItemsList = users.getUserData(username);
    if (!lenderItemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    const item = lenderItemsList.getItem(id);
    if (!item) {
        res.status(400).json({ error: 'required-item' });
        return;
    }

    const borrowerNotifs = users.getUserNotifications(item.borrower);
    if (!borrowerNotifs) {
        res.status(404).json({ error: 'userNotExist' });
        return;
    }

    const message = `${item.lender} 提醒您归还物品：${item.itemDetail}，应还日期 ${item.backDate}`;
    const notif = borrowerNotifs.add('return_reminder', message, id);
    res.json({ notification: notif });
}

function updateItem(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const { itemReturned } = req.body;
    const itemsList = users.getUserData(username);
    if (!itemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }
    itemsList.updateItem(id, itemReturned);
    const item = itemsList.getItem(id);
    if (item && !item.visitor) {
        const borrowerList = users.getUserItemsList(item.borrower);
        if (borrowerList) {
            if (itemReturned === true) {
                if (borrowerList.contains(id)) {
                    borrowerList.deleteItem(id);
                }
            } else if (itemReturned === false) {
                if (!borrowerList.contains(id)) {
                    borrowerList.addBorrowedItem(item);
                }
            }
        }
    }
    res.json(item);
}

function deleteItem(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }
    const { id } = req.params;
    const itemsList = users.getUserData(username);
    if (!itemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }
    const item = itemsList.getItem(id);
    if (item.lender !== username) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }
    itemsList.deleteItem(id);
    res.json({ message: `item ${id} deleted` });
}

function editItem(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const lenderItemsList = users.getUserData(username);
    if (!lenderItemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    const item = lenderItemsList.getItem(id);
    if (item.lender !== username) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { itemDetail, backDate, lentDate } = req.body;
    const updates = {};
    if (itemDetail !== undefined) updates.itemDetail = itemDetail;
    if (backDate !== undefined) updates.backDate = backDate;
    if (lentDate !== undefined) updates.lentDate = lentDate;

    const updatedItem = lenderItemsList.editItem(id, updates);

    // Sync changes to borrower's side
    const borrowerItemsList = users.getUserItemsList(item.borrower);
    if (borrowerItemsList && borrowerItemsList.contains(id)) {
        borrowerItemsList.editItem(id, updates);
    }

    res.json({ item: updatedItem });
}

function modifyDueDate(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const borrowerItemsList = users.getUserData(username);
    if (!borrowerItemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    const item = borrowerItemsList.getItem(id);
    if (item.borrower !== username) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    if (item.modifyRemaining === 0) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { backDate } = req.body;
    if (!backDate) {
        res.status(400).json({ error: 'required-backDate' });
        return;
    }

    // Update borrower's side
    const updatedItem = borrowerItemsList.modifyDueDate(id, backDate);

    // Sync changes to lender's side
    const lenderItemsList = users.getUserItemsList(item.lender);
    if (lenderItemsList && lenderItemsList.contains(id)) {
        lenderItemsList.modifyDueDate(id, backDate);
    }

    // Notify the lender
    const lenderNotifs = users.getUserNotifications(item.lender);
    if (lenderNotifs) {
        lenderNotifs.add(
            'date_modified',
            `${item.borrower} 修改了归还日期：${item.itemDetail}，新日期 ${backDate}`,
            id
        );
    }

    res.json({ item: updatedItem });
}

function updateModifyLimit(req, res) {
    const sid = req.cookies.sid;
    const username = sid ? sessions.getSessionUser(sid) : '';

    if (!sid || !users.isValidUsername(username)) {
        res.status(401).json({ error: 'auth-missing' });
        return;
    }

    const { id } = req.params;
    const lenderItemsList = users.getUserData(username);
    if (!lenderItemsList.contains(id)) {
        res.status(404).json({ error: 'item-missing' });
        return;
    }

    const item = lenderItemsList.getItem(id);
    if (item.lender !== username) {
        res.status(403).json({ error: 'forbidden' });
        return;
    }

    const { modifyLimit } = req.body;
    const isValidLimit = modifyLimit === -1 || modifyLimit === 0 || (Number.isInteger(modifyLimit) && modifyLimit > 0);
    if (!isValidLimit) {
        res.status(400).json({ error: 'invalid-modifyLimit' });
        return;
    }

    const updatedItem = lenderItemsList.updateModifyLimit(id, modifyLimit);

    // Sync to borrower's side
    const borrowerItemsList = users.getUserItemsList(item.borrower);
    if (borrowerItemsList && borrowerItemsList.contains(id)) {
        borrowerItemsList.updateModifyLimit(id, modifyLimit);
    }

    res.json({ item: updatedItem });
}

export default {
    getItemsList,
    addItem,
    sendNotice,
    updateItem,
    deleteItem,
    editItem,
    modifyDueDate,
    updateModifyLimit
};
