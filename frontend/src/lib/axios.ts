import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost/api",
    withCredentials: true,
});

export default api;