import { showToast } from "../function/toascontainer.js";

// Axios is loaded by visitor-registration.html before this module runs.
const httpClient = globalThis.axios;

if (!httpClient) {
  throw new Error("Axios must be loaded before DB-server.js.");
}

const API_ORIGIN = window.location.protocol + "//" + window.location.hostname;
const API_URL =
  API_ORIGIN +
  "/UNP_Visitor_Registration/src/backend/handle-registration/visitorRegistration.php";

export const apiClient = httpClient.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    showToast("API request failed", "danger");
    return Promise.reject(error);
  },
);
