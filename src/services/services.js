export function fetchSession() {
    return fetch('api/v1/session')
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchLogout() {
    return fetch('api/v1/session', {
        method: 'DELETE'
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchLogin(username) {
    return fetch('api/v1/session', {
        method: 'POST',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ username })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchItems() {
    return fetch('api/v1/items')
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchAddItem(itemInfo) {
    return fetch('api/v1/items', {
        method: 'POST',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ itemInfo })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchDeleteItem(id) {
    return fetch(`api/v1/items/${id}`, {
        method: 'DELETE'
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchUpdateItem(id, itemReturned) {
    return fetch(`api/v1/items/${id}`, {
        method: 'PATCH',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ itemReturned })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchSendNotice(id) {
    return fetch(`api/v1/items/${id}`, {
        method: 'POST',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ id })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchRegister(username) {
    return fetch('api/v1/users', {
        method: 'POST',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ username })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchEditItem(id, updates) {
    return fetch(`api/v1/items/${id}`, {
        method: 'PUT',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify(updates)
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchModifyDueDate(id, newBackDate) {
    return fetch(`api/v1/items/${id}/duedate`, {
        method: 'PATCH',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ backDate: newBackDate })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchUpdateModifyLimit(id, modifyLimit) {
    return fetch(`api/v1/items/${id}/modifylimit`, {
        method: 'PATCH',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({ modifyLimit })
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchNotifications() {
    return fetch('api/v1/notifications')
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchMarkNotificationsRead() {
    return fetch('api/v1/notifications/read', {
        method: 'PATCH',
        headers: new Headers({
            'content-type': 'application/json'
        }),
        body: JSON.stringify({})
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}

export function fetchDeleteNotification(id) {
    return fetch(`api/v1/notifications/${id}`, {
        method: 'DELETE'
    })
        .catch(() => Promise.reject({ error: 'networkError' }))
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return response.json()
                .catch(error => Promise.reject({ error }))
                .then(err => Promise.reject(err));
        });
}
