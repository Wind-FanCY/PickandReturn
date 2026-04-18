import { randomUUID as uuid } from 'crypto';

const sessions = {};

function addSession(username) {
    const sid = uuid();
    sessions[sid] = {
        username,
        language: 'zh'
    };
    return sid;
}

function getSessionUser(sid) {
    return sessions[sid]?.username;
}

function getSession(sid) {
    return sessions[sid] || null;
}

function setLanguage(sid, lang) {
    if (!sessions[sid]) return null;
    sessions[sid].language = lang;
    return sessions[sid];
}

function deleteSession(sid) {
    delete sessions[sid];
}

export default {
    addSession,
    deleteSession,
    getSessionUser,
    getSession,
    setLanguage
};