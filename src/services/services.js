// 统一的错误解析：response 非 2xx 时，解析 body 的 { error } 并 throw；
// body 不是合法 JSON 时 fall back 成 { error: 'networkError' }。
async function parseError(response) {
    try {
        return await response.json();
    } catch {
        return { error: 'networkError' };
    }
}

async function apiFetch(path, options) {
    let response;
    try {
        response = await fetch(path, options);
    } catch {
        throw { error: 'networkError' };
    }
    if (!response.ok) {
        throw await parseError(response);
    }
    return response.json();
}

const JSON_HEADERS = { 'content-type': 'application/json' };

export async function fetchSession() {
    return apiFetch('api/v1/session');
}

export async function fetchLogout() {
    return apiFetch('api/v1/session', { method: 'DELETE' });
}

export async function fetchLogin(username, password) {
    return apiFetch('api/v1/session', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ username, password })
    });
}

export async function fetchItems() {
    return apiFetch('api/v1/items');
}

export async function fetchAddItem(itemInfo) {
    return apiFetch('api/v1/items', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ itemInfo })
    });
}

export async function fetchDeleteItem(id) {
    return apiFetch(`api/v1/items/${id}`, { method: 'DELETE' });
}

export async function fetchSendNotice(id) {
    return apiFetch(`api/v1/items/${id}/remind`, { method: 'POST' });
}

export async function fetchRequestReturn(id) {
    return apiFetch(`api/v1/items/${id}/request-return`, { method: 'POST' });
}

export async function fetchConfirmReturn(id) {
    return apiFetch(`api/v1/items/${id}/confirm-return`, { method: 'POST' });
}

export async function fetchRegister(username, password) {
    return apiFetch('api/v1/users', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ username, password })
    });
}

export async function fetchEditItem(id, updates) {
    return apiFetch(`api/v1/items/${id}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(updates)
    });
}

export async function fetchModifyDueDate(id, newBackDate) {
    return apiFetch(`api/v1/items/${id}/duedate`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ backDate: newBackDate })
    });
}

export async function fetchUpdateModifyLimit(id, modifyLimit) {
    return apiFetch(`api/v1/items/${id}/modifylimit`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ modifyLimit })
    });
}

export async function fetchNotifications() {
    return apiFetch('api/v1/notifications');
}

export async function fetchMarkNotificationsRead() {
    return apiFetch('api/v1/notifications/read', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({})
    });
}

export async function fetchDeleteNotification(id) {
    return apiFetch(`api/v1/notifications/${id}`, { method: 'DELETE' });
}

export async function fetchUpdateLanguage(language) {
    return apiFetch('api/v1/session', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ language })
    });
}
