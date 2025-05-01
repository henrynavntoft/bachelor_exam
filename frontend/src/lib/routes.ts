const API_BASE = '/api';

export const routes = {
    auth: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        me: `${API_BASE}/auth/me`,
        signup: `${API_BASE}/auth/signup`,
    },
    events: {
        all: `${API_BASE}/events`,
        byId: (id: string) => `${API_BASE}/events/${id}`,
        delete: (id: string) => `${API_BASE}/events/${id}`,
        update: (id: string) => `${API_BASE}/events/${id}`,
        create: `${API_BASE}/events`,
    },
    users: {
        all: `${API_BASE}/users`,
        byId: (id: string) => `${API_BASE}/users/${id}`,
        delete: (id: string) => `${API_BASE}/users/${id}`,
        update: (id: string) => `${API_BASE}/users/${id}`,
    },
    upload: {
        upload: `${API_BASE}/upload`,
        delete: `${API_BASE}/upload`,
    },
};