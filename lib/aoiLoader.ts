import axios from "axios";

let activeRequests = 0;
let setGlobalLoading: (isLoading: boolean) => void;

export const setGlobalLoadingHandler = (handler: (isLoading: boolean) => void) => {
  setGlobalLoading = handler;
};

const api = axios.create({
  baseURL: "/api", // Adjust base URL as needed
});

// Add interceptors
api.interceptors.request.use((config) => {
  activeRequests++;
  if (setGlobalLoading) setGlobalLoading(true);
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0 && setGlobalLoading) setGlobalLoading(false);
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0 && setGlobalLoading) setGlobalLoading(false);
    return Promise.reject(error);
  }
);

export default api;
