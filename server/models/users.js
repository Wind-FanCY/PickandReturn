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

function getUserData(username) {
    return users[username];
}

function registerUser(username, userData) {
    registeredUsers.add(username);
    users[username] = userData;
}

function addUserData(username, userData) {
    registerUser(username, userData);
}

export default {
    isValidUsername,
    isPermittedUsername,
    isRegisteredUser,
    getUserData,
    registerUser,
    addUserData
};
