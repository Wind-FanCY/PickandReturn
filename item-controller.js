import sessions from "./sessions.js";
import users from "./users.js";

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
    const itemsList = users.getUserData(username);
    const id = itemsList.addLentItem(itemInfo);
    res.json(itemsList.getItem(id));
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

    const itemInfo = lenderItemsList.getItem(id);
    if (!itemInfo) {
        res.status(400).json({ error: 'required-item' });
        return;
    }
    
    const borrowerData = users.getUserData(itemInfo.borrower);
    const existing = borrowerData !== undefined;
    if (!existing) {
        res.status(404).json({ error: 'userNotExist' });
        return;
    }
    const borrowerItemsList = borrowerData;
    const noticeId = borrowerItemsList.addBorrowedItem(itemInfo);
    res.json(borrowerItemsList.getItem(noticeId));
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
    res.json(itemsList.getItem(id));
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
    itemsList.deleteItem(id);
    res.json({ message: `item ${id} deleted `});
}

export default {
    getItemsList,
    addItem,
    sendNotice,
    updateItem,
    deleteItem
};


