import axios from "axios";

// ✅ Base path set to match your backend's EXPRESS_BASE_PATH
const api = axios.create({
  baseURL: import.meta.env.PROD ? "https://pegslam.com/api" : "/api",  // 👈 this is the key fix
  withCredentials: true,    // needed if you're using sessions/cookies
});

export default api;
