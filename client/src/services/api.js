import axios from "axios";

// Use the same host as the frontend but on port 5000 for the API
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Extract host and use it with port 5000
  const host = window.location.hostname;
  return `http://${host}:5000/api`;
};

const api = axios.create({ baseURL: getApiBase() });

export function sendVerificationCode(email) {
  return api.post("/auth/send-code", { email });
}

export function verifyCode(email, code) {
  return api.post("/auth/verify-code", { email, code });
}

export default api;
