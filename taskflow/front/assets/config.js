(function initTaskflowConfig() {
  const LOCAL_API_BASE = "http://localhost:5000";
  const PROD_API_BASE = "https://taskflow-back-production.up.railway.app";
  const STORAGE_KEY = "taskflow_api_base";

  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const sanitizeBaseUrl = (value) => {
    if (!value) {
      return "";
    }
    return String(value).trim().replace(/\/+$/, "");
  };

  const defaultApiBase = isLocalHost ? LOCAL_API_BASE : PROD_API_BASE;
  const storedRaw = localStorage.getItem(STORAGE_KEY);
  const stored = sanitizeBaseUrl(storedRaw);

  if (!isLocalHost && /(localhost|127\.0\.0\.1)/i.test(stored)) {
    localStorage.removeItem(STORAGE_KEY);
  }

  const apiBase = sanitizeBaseUrl(localStorage.getItem(STORAGE_KEY)) || defaultApiBase;

  window.TaskflowConfig = {
    api: {
      local: LOCAL_API_BASE,
      production: PROD_API_BASE,
      current: apiBase,
    },
    storage: {
      apiBaseKey: STORAGE_KEY,
    },
    env: {
      isLocalHost,
    },
    getApiBase() {
      return this.api.current;
    },
  };
})();
