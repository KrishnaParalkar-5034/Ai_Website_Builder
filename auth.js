const API_BASE = (window.location.hostname === 'localhost' && window.location.port === '5500')
    ? ''
    : 'http://localhost:5500';

function getToken() {
    return localStorage.getItem('sitebuilder_token');
}

function getUser() {
    const raw = localStorage.getItem('sitebuilder_user');
    return raw ? JSON.parse(raw) : null;
}

function setSession(user, token) {
    localStorage.setItem('sitebuilder_user', JSON.stringify(user));
    localStorage.setItem('sitebuilder_token', token);
}

function clearSession() {
    localStorage.removeItem('sitebuilder_user');
    localStorage.removeItem('sitebuilder_token');
}

function isLoggedIn() {
    return !!getToken();
}

function redirectIfAuthenticated(redirectTo = 'index.html') {
    if (isLoggedIn()) {
        window.location.href = redirectTo;
        return true;
    }
    return false;
}

async function initAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
        return null;
    }

    try {
        const response = await fetch(`${API_BASE}/api/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (!response.ok) {
            clearSession();
            window.location.href = 'login.html';
            return null;
        }

        const user = await response.json();
        setSession(user, getToken());
        return user;
    } catch {
        window.location.href = 'login.html';
        return null;
    }
}

async function authFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (response.status === 401) {
        clearSession();
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }

    return response;
}

async function logout() {
    try {
        if (getToken()) {
            await authFetch('/api/logout', { method: 'POST' });
        }
    } catch {
        // Session may already be invalid
    } finally {
        clearSession();
        window.location.href = 'login.html';
    }
}

function updateNavForAuth() {
    const getStarted = document.querySelector('.btn-get-started');
    if (getStarted) {
        getStarted.href = isLoggedIn() ? 'index.html' : 'login.html';
        getStarted.textContent = isLoggedIn() ? 'Open Builder' : 'Get started';
    }

    const createLink = document.querySelector('[data-auth-link="builder"]');
    if (createLink) {
        createLink.href = isLoggedIn() ? 'index.html' : 'login.html';
    }
}
