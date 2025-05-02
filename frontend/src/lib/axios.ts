import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Cached CSRF token
let csrfToken: string | null = null;

// Create Axios instance
const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

// Fetch CSRF token from server
async function fetchCsrfToken(): Promise<string> {
    if (!csrfToken) {
        const response = await axios.get<{ csrfToken: string }>(
            `${API_BASE}/csrf-token`,
            { withCredentials: true }
        );
        csrfToken = response.data.csrfToken;
    }
    return csrfToken;
}

// Request interceptor to attach CSRF token header
api.interceptors.request.use(async (config) => {
    const token = await fetchCsrfToken();
    if (config.headers) {
        config.headers['x-csrf-token'] = token;
    }
    return config;
});

export default api;