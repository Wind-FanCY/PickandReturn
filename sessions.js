import { randomUUID as uuid } from 'crypto';

const sessions = {};

function addSession(username) {
    const sid = uuid();
    sessions[sid] = {
        username
    };
    return sid;
}

function getSessionUser(sid) {
    return sessions[sid]?.username;
}

function deleteSession(sid) {
    delete sessions[sid];
}

export default {
    addSession,
    deleteSession,
    getSessionUser
};