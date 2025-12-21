const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const API_SERVER_URL = API_BASE_URL.replace("/api", "");

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SERVER_URL: API_SERVER_URL,
};

export default API_CONFIG;
