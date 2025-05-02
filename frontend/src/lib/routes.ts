const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const routes = {
    auth: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        me: `${API_BASE}/auth/me`,
        signup: `${API_BASE}/auth/signup`,
    },
    events: {
        all: `${API_BASE}/events`,
        one: (id: string) => `${API_BASE}/events/${id}`,
        delete: (id: string) => `${API_BASE}/events/${id}`,
        update: (id: string) => `${API_BASE}/events/${id}`,
        create: `${API_BASE}/events`,
    },
    users: {
        all: `${API_BASE}/users`,
        one: (id: string) => `${API_BASE}/users/${id}`,
        delete: (id: string) => `${API_BASE}/users/${id}`,
        update: (id: string) => `${API_BASE}/users/${id}`,
    },
    upload: {
        upload: (id: string) => `${API_BASE}/upload/${id}`,
        delete: (id: string) => `${API_BASE}/upload/${id}`,
    },
};