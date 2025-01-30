import axios from "axios";

// Define base URL (can be moved to an .env file)
const API_BASE_URL = "http://127.0.0.1:8000";

// Create an Axios instance with default configs
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
