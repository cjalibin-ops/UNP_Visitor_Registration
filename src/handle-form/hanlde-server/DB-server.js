import { showToast } from "../function/toascontainer.js";

// handle-API.js
export const apiClient = axios.create({
  baseURL: "http://localhost/Entryx-Visitor-Campus/EntryX-Visitor-dashboard/src/backend/handle-registraton/visitorRegistration.php",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer a3f9c1d7e2b84a6f9c0d12e3f4567890"
  },
  timeout: 3000
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error("API Error:", error);
        showToast("API request failed", "danger");
        return Promise.reject(error);
    }
);