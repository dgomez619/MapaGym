import axios from 'axios';
import type { AxiosInstance } from 'axios';

// 1. Define the base URL dynamically
const baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// 2. Create a custom Axios instance
const axiosClient: AxiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    // You can add other headers here later (like Authorization tokens)
  },
});

export default axiosClient;