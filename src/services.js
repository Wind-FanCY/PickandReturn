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

