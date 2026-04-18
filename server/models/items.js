import { randomUUID as uuid } from "crypto";

function makeItemsList() {
    const id1 = uuid();
    const id2 = uuid();

    const itemsList = {};
    const items = {
        [id1]: {
            id: id1,
            itemDetail: 'This is a visitor demo. You can see the item information you lent to someone here',
            lender: 'visitor1',
            borrower: 'visitor2',
            lentDate: '2026-04-01',
            backDate: '2026-05-01',
            returned: false,
            visitor: true,
            modifyLimit: 3,
            modifyRemaining: 3,
<<<<<<< Updated upstream
            lastAutoReminderDate: null
=======
            lastAutoReminderDate: null,
            createdAt: '2026-04-01T08:00:00.000Z'
>>>>>>> Stashed changes
        },
        [id2]: {
            id: id2,
            itemDetail: 'This is a visitor demo. You can see the item information you need to return',
            lender: 'visitor2',
            borrower: 'visitor1',
            lentDate: '2026-03-21',
            backDate: '2026-06-01',
            returned: false,
            visitor: true,
            modifyLimit: 3,
            modifyRemaining: 3,
<<<<<<< Updated upstream
            lastAutoReminderDate: null
=======
            lastAutoReminderDate: null,
            createdAt: '2026-03-21T08:00:00.000Z'
>>>>>>> Stashed changes
        }
    };

    itemsList.contains = function contains(id) {
        return !!items[id];
    };

    itemsList.getItems = function getItems() {
        return items;
    };

    itemsList.addLentItem = function addLentItem(itemInfo) {
        const id = uuid();
        const limit = (itemInfo.modifyLimit !== undefined) ? itemInfo.modifyLimit : 3;
        items[id] = {
            id,
            itemDetail: itemInfo.itemDetail,
            lender: itemInfo.lender,
            borrower: itemInfo.borrower,
            lentDate: itemInfo.lentDate,
            backDate: itemInfo.backDate,
            returned: false,
            visitor: false,
            modifyLimit: limit,
            modifyRemaining: limit,
            lastAutoReminderDate: null
        };
        return id;
    };

    itemsList.addBorrowedItem = function addBorrowedItem(itemInfo) {
        const id = itemInfo.id;
        items[id] = Object.assign({}, itemInfo);
        return id;
    };

    itemsList.getItem = function getItem(id) {
        return items[id];
    };

    itemsList.updateItem = function updateItem(id, itemReturned) {
        items[id].returned = itemReturned ?? items[id].returned;
    };

    itemsList.deleteItem = function deleteItem(id) {
        delete items[id];
    };

    // Edit item — only allows updating itemDetail, backDate, lentDate
    itemsList.editItem = function editItem(id, updates) {
        if (!items[id]) return null;
        const allowed = ['itemDetail', 'backDate', 'lentDate'];
        allowed.forEach(function(field) {
            if (updates[field] !== undefined) {
                items[id][field] = updates[field];
            }
        });
        return items[id];
    };

    // Modify due date — decrements modifyRemaining (unless -1 = unlimited)
    itemsList.modifyDueDate = function modifyDueDate(id, newBackDate) {
        if (!items[id]) return null;
        items[id].backDate = newBackDate;
        if (items[id].modifyRemaining !== -1 && items[id].modifyRemaining > 0) {
            items[id].modifyRemaining -= 1;
        }
        return items[id];
    };

    // Update modifyLimit and reset modifyRemaining to the new limit
    itemsList.updateModifyLimit = function updateModifyLimit(id, newLimit) {
        if (!items[id]) return null;
        items[id].modifyLimit = newLimit;
        items[id].modifyRemaining = newLimit;
        return items[id];
    };

    // Update lastAutoReminderDate for the daily reminder job
    itemsList.updateLastReminderDate = function updateLastReminderDate(id, date) {
        if (!items[id]) return null;
        items[id].lastAutoReminderDate = date;
        return items[id];
    };

    return itemsList;
}

export default {
    makeItemsList
};
