import notifications from './notifications.js';

const users = {};
const registeredUsers = new Set();

function isValidUsername(username) {
    let isValid = true;
    isValid = !!username && username.trim();
    isValid = isValid && username.match(/^[a-zA-Z0-9_]+$/);
    return isValid;
}

function isPermittedUsername(username) {
    return username.toLowerCase() !== "dog";
}

function isRegisteredUser(username) {
    return registeredUsers.has(username);
}

// Returns the itemsList instance for backward compatibility
function getUserData(username) {
    const record = users[username];
    if (!record) return undefined;
    return record.itemsList;
}

// Explicit alias — returns itemsList instance
function getUserItemsList(username) {
    const record = users[username];
    if (!record) return null;
    return record.itemsList;
}

// Returns the notificationsList instance for the given user
function getUserNotifications(username) {
    const record = users[username];
    if (!record) return null;
    return record.notificationsList;
}

function registerUser(username, itemsList) {
    registeredUsers.add(username);
    users[username] = {
        itemsList,
        notificationsList: notifications.makeNotificationsList(username)
    };
}

function addUserData(username, userData) {
    registerUser(username, userData);
}

// Returns array of all registered usernames
function getAllUsers() {
    return Array.from(registeredUsers);
}

export default {
    isValidUsername,
    isPermittedUsername,
    isRegisteredUser,
    getUserData,
    getUserItemsList,
    getUserNotifications,
    registerUser,
    addUserData,
    getAllUsers
};
