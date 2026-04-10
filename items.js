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
            lentDate: '2025-04-14',
            backDate: '2025-04-21',
            returned: false,
            visitor: true
        },
        [id2]: {
            id: id2,
            itemDetail: 'This is a visitor demo. You can see the item information you need to return',
            lender: 'visitor2',
            borrower: 'visitor1',
            lentDate: '2025-03-21',
            backDate: '2025-05-06',
            returned: false,
            visitor: true
        }
    };

    itemsList.contains = function contains(id) {
        return !!items[id];
    };

    itemsList.getItems = function getItems() {
        return items;
    }

    itemsList.addLentItem = function addLentItem(itemInfo) {
        const id = uuid();
        items[id] = {
            id,
            itemDetail: itemInfo.itemDetail,
            lender: itemInfo.lender,
            borrower: itemInfo.borrower,
            lentDate: itemInfo.lentDate,
            backDate: itemInfo.backDate,
            returned: false,
            visitor: false
        };
        return id;
    };

    itemsList.addBorrowedItem = function addBorrowedItem(itemInfo) {
        const id = itemInfo.id;
        items[id] = {
            ...itemInfo
        };
        return id;
    };

    itemsList.getItem = function getItem(id) {
        return items[id];
    }

    itemsList.updateItem = function updateItem(id, itemReturned) {
        items[id].returned = itemReturned ?? items[id].returned;
    }

    itemsList.deleteItem = function deleteItem(id) {
        delete items[id];
    }

    return itemsList;
};

export default {
    makeItemsList
};