import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const hasAuth =
      config.headers.Authorization ||
      (typeof config.headers.get === "function" && config.headers.get("Authorization"));

    if (!hasAuth) {
      let token: string | null = null;
      if (
        url.includes("/farmer") ||
        url.includes("/ai") ||
        url.includes("/weather") ||
        url.includes("/pdf")
      ) {
        token = localStorage.getItem("farmerToken") || localStorage.getItem("token");
      } else if (url.includes("/owner")) {
        token = localStorage.getItem("ownerToken") || localStorage.getItem("token");
      } else if (url.includes("/labour")) {
        token = localStorage.getItem("labourToken") || localStorage.getItem("token");
      } else {
        token =
          localStorage.getItem("farmerToken") ||
          localStorage.getItem("ownerToken") ||
          localStorage.getItem("labourToken") ||
          localStorage.getItem("token");
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;