import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

export const BASE_URL = "https://api.cnmacademy.in/api"
// export const BASE_URL = "http://localhost:3001/api"

// Create Axios instance
export const http = axios.create({
  baseURL: BASE_URL, // replace with your actual base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios interceptor to logout on 401
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401)
      { 
        const logout = useAuthStore.getState().logout;
        logout()
    ;}else {
      throw error
    }
  }
);

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers!["api-access-token"] = token;
  } else {
    delete config.headers!["api-access-token"];
  }
  return config;
});

