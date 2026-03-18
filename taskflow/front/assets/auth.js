const API_BASE = window.TaskflowConfig?.getApiBase?.() || "http://localhost:5000";
const TOKEN_KEY = "taskflow_token";
const USER_KEY = "taskflow_user";

console.log("[TaskFlow][Auth] API_BASE:", API_BASE);

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");
const feedback = document.getElementById("feedback");
const session = document.getElementById("session");
const sessionUser = document.getElementById("session-user");
const sessionEmail = document.getElementById("session-email");
const logoutBtn = document.getElementById("logout-btn");
const DASHBOARD_PATH = "./dashboard.html";

const showFeedback = (message, type) => {
  feedback.textContent = message || "";
  feedback.className = "feedback";
  if (type) {
    feedback.classList.add(type);
  }
};

const switchTab = (tab) => {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  formLogin.classList.toggle("hidden", !isLogin);
  formRegister.classList.toggle("hidden", isLogin);
  showFeedback("");
};

const getApiErrorMessage = async (res) => {
  try {
    const payload = await res.json();
    return payload?.message || payload?.error?.message || "Erreur inconnue";
  } catch (_error) {
    return "Erreur inconnue";
  }
};

const persistSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  renderSession();
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  renderSession();
};

const renderSession = () => {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    session.classList.add("hidden");
    return;
  }

  try {
    const user = JSON.parse(rawUser);
    sessionUser.textContent = user.username || "-";
    sessionEmail.textContent = user.email || "-";
    session.classList.remove("hidden");
  } catch (_error) {
    clearSession();
  }
};

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("Connexion en cours...");

  const identifier = formLogin.identifier.value.trim();
  const password = formLogin.password.value;

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    showFeedback(await getApiErrorMessage(res), "error");
    return;
  }

  const payload = await res.json();
  persistSession({ token: payload.token, user: payload.user });
  showFeedback("Connexion reussie", "success");
  formLogin.reset();
  window.location.href = DASHBOARD_PATH;
});

formRegister.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("Creation du compte...");

  const username = formRegister.username.value.trim();
  const email = formRegister.email.value.trim();
  const password = formRegister.password.value;

  const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!registerRes.ok) {
    showFeedback(await getApiErrorMessage(registerRes), "error");
    return;
  }

  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    showFeedback("Compte cree, mais connexion automatique echouee", "error");
    return;
  }

  const payload = await loginRes.json();
  persistSession({ token: payload.token, user: payload.user });
  showFeedback("Compte cree et connecte", "success");
  formRegister.reset();
  switchTab("login");
  window.location.href = DASHBOARD_PATH;
});

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));
logoutBtn.addEventListener("click", () => {
  clearSession();
  showFeedback("Session supprimee", "success");
});

renderSession();

if (localStorage.getItem(TOKEN_KEY)) {
  window.location.href = DASHBOARD_PATH;
}
