const API_BASE = localStorage.getItem("taskflow_api_base") || "http://localhost:5000";
const TOKEN_KEY = "taskflow_token";
const USER_KEY = "taskflow_user";

const feedback = document.getElementById("feedback");
const kanbanBoard = document.getElementById("kanban-board");
const scopeLabel = document.getElementById("scope-label");
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");
const createTaskBtn = document.getElementById("create-task-btn");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const statusFilter = document.getElementById("status-filter");
const userFilter = document.getElementById("user-filter");
const statTotal = document.getElementById("stat-total");
const statDue = document.getElementById("stat-due");
const statDone = document.getElementById("stat-done");
const completionRate = document.getElementById("completion-rate");
const statusPieChart = document.getElementById("status-pie-chart");
const statusPieLegend = document.getElementById("status-pie-legend");
const categoryPieChart = document.getElementById("category-pie-chart");
const categoryPieLegend = document.getElementById("category-pie-legend");

let allTasks = [];
let filteredTasks = [];
let categoriesRef = [];
let statusesRef = [];
let usersRef = [];
let isAdminView = false;
let currentUser = null;

const showFeedback = (message) => {
  feedback.textContent = message || "";
};

const normalizeDateOnly = (value) => {
  if (!value) {
    return "";
  }
  const raw = String(value);
  const simple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (simple) {
    return `${simple[1]}-${simple[2]}-${simple[3]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
  const normalized = normalizeDateOnly(value);
  if (!normalized) {
    return "-";
  }
  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const currentUserId = () => currentUser?.id || currentUser?._id || null;

const getTaskUserId = (task) =>
  task?.idUser?._id || task?.idUser?.id || (typeof task?.idUser === "string" ? task.idUser : null);

const canEditTask = (task) => {
  if (!task) {
    return false;
  }
  if (isAdminView) {
    return true;
  }
  const ownerId = getTaskUserId(task);
  const me = currentUserId();
  return Boolean(ownerId && me && ownerId === me);
};

const PIE_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#8b5cf6", "#0891b2"];

const renderPieChart = (items, canvas, legendNode) => {
  if (!canvas || !legendNode) {
    return;
  }
  const entries = [...items.entries()];
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!entries.length) {
    ctx.fillStyle = "#dbe4ee";
    ctx.beginPath();
    ctx.arc(110, 110, 80, 0, Math.PI * 2);
    ctx.fill();
    legendNode.innerHTML = `<span class="chart-legend-item">Aucune donnee</span>`;
    return;
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  let startAngle = -Math.PI / 2;
  const centerX = 110;
  const centerY = 110;
  const radius = 80;

  entries.forEach(([, count], index) => {
    const angle = (count / total) * Math.PI * 2;
    const color = PIE_COLORS[index % PIE_COLORS.length];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fill();
    startAngle += angle;
  });

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 16px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(String(total), centerX, centerY + 6);

  legendNode.innerHTML = entries
    .map(
      ([label, count], index) =>
        `<span class="chart-legend-item"><span class="chart-dot" style="background:${PIE_COLORS[index % PIE_COLORS.length]}"></span>${escapeHtml(label)} (${count})</span>`
    )
    .join("");
};

const renderStatusPieChart = (tasks) => {
  const counts = new Map();
  for (const task of tasks) {
    const label = task.idStatu?.label || "Sans statut";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  renderPieChart(counts, statusPieChart, statusPieLegend);
};

const renderCategoryPieChart = (tasks) => {
  const counts = new Map();
  for (const task of tasks) {
    const label = task.idCategory?.name || "Sans categorie";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  renderPieChart(counts, categoryPieChart, categoryPieLegend);
};

const renderStats = (tasks) => {
  statTotal.textContent = String(tasks.length);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const dueSoon = tasks.filter((task) => {
    if (!task.dueDate) {
      return false;
    }
    const due = new Date(`${task.dueDate}T23:59:59`).getTime();
    return due >= now && due <= now + sevenDays;
  }).length;
  const done = tasks.filter((task) =>
    (task.idStatu?.label || "").toLowerCase().includes("fini")
  ).length;

  statDue.textContent = String(dueSoon);
  statDone.textContent = String(done);
  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  completionRate.textContent = `${rate}%`;
  renderStatusPieChart(tasks);
  renderCategoryPieChart(tasks);
};

const renderKanban = (tasks) => {
  const grouped = new Map();
  for (const task of tasks) {
    const label = task.idStatu?.label || "Sans statut";
    if (!grouped.has(label)) {
      grouped.set(label, []);
    }
    grouped.get(label).push(task);
  }

  const preferredOrder = ["To do", "En cours", "Fini"];
  const labels = [...grouped.keys()].sort((a, b) => {
    const ia = preferredOrder.indexOf(a);
    const ib = preferredOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (!labels.length) {
    kanbanBoard.innerHTML = "<p>Aucune task disponible.</p>";
    return;
  }

  kanbanBoard.innerHTML = labels
    .map((label) => {
      const columnTasks = grouped.get(label);
      const dotClass = label.toLowerCase().includes("fini")
        ? "dot-done"
        : label.toLowerCase().includes("cours")
        ? "dot-progress"
        : "dot-todo";

      const cards = columnTasks
        .map(
          (task) => `
        <article class="card" data-task-id="${escapeHtml(task._id)}" tabindex="0" role="button">
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description || "-")}</p>
          <div class="meta">
            <span class="meta-pill pill-category">${escapeHtml(task.idCategory?.name || "-")}</span>
            <span class="meta-pill pill-user">${escapeHtml(task.idUser?.username || "-")}</span>
            <span class="meta-pill pill-date">${escapeHtml(formatDate(task.dueDate))}</span>
          </div>
        </article>
      `
        )
        .join("");

      return `
      <section class="column">
        <div class="column-header">
          <div class="column-title"><span class="status-dot ${dotClass}"></span>${escapeHtml(label)}</div>
          <span class="badge">${columnTasks.length}</span>
        </div>
        ${cards || "<p>Aucune task</p>"}
      </section>
    `;
    })
    .join("");
};

const applyFilters = () => {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const user = userFilter.value;

  filteredTasks = allTasks.filter((task) => {
    const title = (task.title || "").toLowerCase();
    const desc = (task.description || "").toLowerCase();
    const taskCategory = task.idCategory?.name || "";
    const taskStatus = task.idStatu?.label || "";
    const taskUser = task.idUser?.username || "";

    if (search && !title.includes(search) && !desc.includes(search)) return false;
    if (category && taskCategory !== category) return false;
    if (status && taskStatus !== status) return false;
    if (user && taskUser !== user) return false;
    return true;
  });

  renderStats(filteredTasks);
  renderKanban(filteredTasks);
};

const hydrateFilters = (tasks) => {
  const previousCategory = categoryFilter.value;
  const previousStatus = statusFilter.value;
  const previousUser = userFilter.value;

  const categories = [...new Set(tasks.map((task) => task.idCategory?.name).filter(Boolean))].sort();
  const statuses = [...new Set(tasks.map((task) => task.idStatu?.label).filter(Boolean))].sort();
  const users = [...new Set(tasks.map((task) => task.idUser?.username).filter(Boolean))].sort();

  categoryFilter.innerHTML = `<option value="">Toutes les categories</option>${categories
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;

  statusFilter.innerHTML = `<option value="">Tous les statuts</option>${statuses
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;

  userFilter.innerHTML = `<option value="">Tous les utilisateurs</option>${users
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;

  categoryFilter.value = categories.includes(previousCategory) ? previousCategory : "";
  statusFilter.value = statuses.includes(previousStatus) ? previousStatus : "";
  userFilter.value = users.includes(previousUser) ? previousUser : "";
};

const fetchWithToken = async (path, token, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

const extractApiMessage = async (res, fallbackMessage) => {
  try {
    const body = await res.json();
    return body?.message || body?.error?.message || fallbackMessage;
  } catch (_error) {
    return fallbackMessage;
  }
};

const findTaskById = (taskId) => allTasks.find((task) => task._id === taskId);

const loadReferences = async (token) => {
  const [categoriesRes, statusesRes, usersRes] = await Promise.all([
    fetchWithToken("/api/categories", token),
    fetchWithToken("/api/status", token),
    fetchWithToken("/api/auth/users", token),
  ]);

  categoriesRef = categoriesRes.ok ? await categoriesRes.json() : [];
  statusesRef = statusesRes.ok ? await statusesRes.json() : [];
  usersRef = usersRes.ok ? await usersRes.json() : [];
};

const loadTasks = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = "./auth.html";
    return;
  }

  showFeedback("Chargement des tasks...");
  await loadReferences(token);

  const allRes = await fetchWithToken("/api/tasks", token);
  if (allRes.status === 200) {
    isAdminView = true;
    allTasks = await allRes.json();
    scopeLabel.textContent = "Vue admin: toutes les tasks";
    hydrateFilters(allTasks);
    applyFilters();
    showFeedback("");
    return;
  }

  if (allRes.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "./auth.html";
    return;
  }

  isAdminView = false;
  const myRes = await fetchWithToken("/api/tasks/me", token);
  if (!myRes.ok) {
    showFeedback("Impossible de charger les tasks.");
    allTasks = [];
    hydrateFilters(allTasks);
    applyFilters();
    return;
  }

  allTasks = await myRes.json();
  scopeLabel.textContent = "Vue utilisateur: mes tasks";
  hydrateFilters(allTasks);
  applyFilters();
  showFeedback("");
};

const renderUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    userName.textContent = "-";
    userEmail.textContent = "-";
    currentUser = null;
    return;
  }

  try {
    currentUser = JSON.parse(rawUser);
    userName.textContent = currentUser.username || "-";
    userEmail.textContent = currentUser.email || "-";
  } catch (_error) {
    currentUser = null;
    userName.textContent = "-";
    userEmail.textContent = "-";
  }
};

const categoryModal = window.createCategoryModalManager(
  {
    modal: document.getElementById("category-modal"),
    backdrop: document.getElementById("category-modal-backdrop"),
    form: document.getElementById("category-modal-form"),
    feedback: document.getElementById("category-modal-feedback"),
    nameInput: document.getElementById("category-modal-name-input"),
    closeBtn: document.getElementById("category-modal-close"),
    saveBtn: document.getElementById("category-modal-save"),
  },
  {
    onSubmit: async (name) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        window.location.href = "./auth.html";
        return;
      }
      if (!name) {
        categoryModal.showFeedback("Le nom de categorie est requis.");
        return;
      }

      categoryModal.setSaving(true);
      categoryModal.showFeedback("Creation de la categorie...");
      const res = await fetchWithToken("/api/categories", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        categoryModal.showFeedback(
          await extractApiMessage(res, "Impossible de creer la categorie")
        );
        categoryModal.setSaving(false);
        return;
      }

      const category = await res.json();
      categoriesRef = [...categoriesRef, category].sort((a, b) => a.name.localeCompare(b.name));
      taskModal.updateCategories(categoriesRef, category._id);
      categoryModal.setSaving(false);
      categoryModal.close();
      taskModal.showFeedback("Categorie creee et selectionnee.");
    },
  }
);

const taskModal = window.createTaskModalManager(
  {
    modal: document.getElementById("task-modal"),
    backdrop: document.getElementById("task-modal-backdrop"),
    closeBtn: document.getElementById("task-modal-close"),
    form: document.getElementById("task-modal-form"),
    titleNode: document.getElementById("task-modal-title"),
    feedbackNode: document.getElementById("task-modal-feedback"),
    permissionNode: document.getElementById("task-modal-permission"),
    ownerNode: document.getElementById("task-modal-owner"),
    idNode: document.getElementById("task-modal-id"),
    saveBtn: document.getElementById("task-modal-save"),
    deleteBtn: document.getElementById("task-modal-delete"),
    titleInput: document.getElementById("task-modal-title-input"),
    descriptionInput: document.getElementById("task-modal-description-input"),
    dueDateInput: document.getElementById("task-modal-dueDate-input"),
    categoryInput: document.getElementById("task-modal-category-input"),
    statusInput: document.getElementById("task-modal-status-input"),
    assigneeInput: document.getElementById("task-modal-assignee-input"),
    addCategoryBtn: document.getElementById("task-modal-add-category-btn"),
  },
  {
    onAddCategory: () => categoryModal.open(),
    onDelete: async ({ taskId }) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        window.location.href = "./auth.html";
        return;
      }
      if (!window.confirm("Confirmer la suppression de cette task ?")) {
        return;
      }

      taskModal.showFeedback("Suppression en cours...");
      const res = await fetchWithToken(`/api/tasks/${taskId}`, token, {
        method: "DELETE",
      });

      if (!res.ok) {
        taskModal.showFeedback(await extractApiMessage(res, "Impossible de supprimer la task"));
        return;
      }

      await loadTasks();
      taskModal.close();
    },
    onSubmit: async ({ mode, taskId, values }) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        window.location.href = "./auth.html";
        return;
      }

      if (mode === "create") {
        if (!values.title || !values.idCategory || !values.idStatu) {
          taskModal.showFeedback("Titre, categorie et statut sont obligatoires.");
          return;
        }
        const me = currentUserId();
        if (!me) {
          taskModal.showFeedback("Session utilisateur invalide.");
          return;
        }

        const payload = {
          title: values.title,
          description: values.description,
          idCategory: values.idCategory,
          idStatu: values.idStatu,
          idUser: isAdminView && values.idUser ? values.idUser : me,
        };
        if (values.dueDate) {
          payload.dueDate = values.dueDate;
        }

        taskModal.showFeedback("Creation en cours...");
        const res = await fetchWithToken("/api/tasks", token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          taskModal.showFeedback(await extractApiMessage(res, "Impossible de creer la task"));
          return;
        }

        await loadTasks();
        taskModal.close();
        return;
      }

      const task = findTaskById(taskId);
      if (!task) {
        taskModal.showFeedback("Task introuvable.");
        return;
      }

      const payload = {};
      if (values.title !== (task.title || "")) payload.title = values.title;
      if (values.description !== (task.description || "")) payload.description = values.description;

      const currentDueDate = normalizeDateOnly(task.dueDate);
      if (values.dueDate && values.dueDate !== currentDueDate) payload.dueDate = values.dueDate;

      const currentCategoryId = task.idCategory?._id || task.idCategory?.id || "";
      if (values.idCategory && values.idCategory !== currentCategoryId) payload.idCategory = values.idCategory;

      const currentStatusId = task.idStatu?._id || task.idStatu?.id || "";
      if (values.idStatu && values.idStatu !== currentStatusId) payload.idStatu = values.idStatu;

      const currentOwnerId = getTaskUserId(task) || "";
      if (isAdminView && values.idUser && values.idUser !== currentOwnerId) {
        payload.idUser = values.idUser;
      }

      if (!Object.keys(payload).length) {
        taskModal.showFeedback("Aucune modification detectee.");
        return;
      }

      taskModal.showFeedback("Sauvegarde en cours...");
      const res = await fetchWithToken(`/api/tasks/${taskId}`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        taskModal.showFeedback(await extractApiMessage(res, "Impossible de modifier la task"));
        return;
      }

      await loadTasks();
      taskModal.close();
    },
  }
);

createTaskBtn.addEventListener("click", () =>
  taskModal.openCreate({
    currentUser,
    isAdminView,
    categoriesRef,
    statusesRef,
    usersRef,
  })
);
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);
userFilter.addEventListener("change", applyFilters);
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "./auth.html";
});

kanbanBoard.addEventListener("click", (event) => {
  const card = event.target.closest(".card[data-task-id]");
  if (!card) {
    return;
  }
  const task = findTaskById(card.dataset.taskId);
  if (!task) {
    return;
  }
  taskModal.openEdit({
    task,
    editable: canEditTask(task),
    isAdminView,
    categoriesRef,
    statusesRef,
    usersRef,
  });
});

kanbanBoard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  const card = event.target.closest(".card[data-task-id]");
  if (!card) {
    return;
  }
  event.preventDefault();
  const task = findTaskById(card.dataset.taskId);
  if (!task) {
    return;
  }
  taskModal.openEdit({
    task,
    editable: canEditTask(task),
    isAdminView,
    categoriesRef,
    statusesRef,
    usersRef,
  });
});

renderUser();
loadTasks();
