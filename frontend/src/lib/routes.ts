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
    },
};