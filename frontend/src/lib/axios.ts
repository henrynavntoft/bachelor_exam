import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;


// Create Axios instance
const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});



export default api;