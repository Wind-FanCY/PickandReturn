const users = {};

function isValidUsername(username) {
    let isValid = true;
    isValid = !!username && username.trim();
    isValid = isValid && username.match(/^[a-zA-Z0-9_]+$/);
    return isValid; 
}

function isPermittedUsername(username) {
    return username.toLowerCase() !== "dog";
}

function getUserData(username) {
    return users[username];
}

function addUserData(username, userData) {
    users[username] = userData;
}

export default {
    isValidUsername,
    isPermittedUsername,
    getUserData,
    addUserData
};
