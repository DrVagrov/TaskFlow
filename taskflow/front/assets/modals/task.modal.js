(() => {
  function createTaskModalManager(elements, callbacks = {}) {
    const {
      modal,
      backdrop,
      closeBtn,
      form,
      titleNode,
      feedbackNode,
      permissionNode,
      ownerNode,
      idNode,
      saveBtn,
      deleteBtn,
      titleInput,
      descriptionInput,
      dueDateInput,
      categoryInput,
      statusInput,
      assigneeInput,
      addCategoryBtn,
    } = elements;

    let mode = "edit";
    let selectedTaskId = null;

    const showFeedback = (message) => {
      feedbackNode.textContent = message || "";
    };

    const close = () => {
      modal.classList.add("hidden");
      selectedTaskId = null;
      mode = "edit";
      showFeedback("");
      if (callbacks.onClose) {
        callbacks.onClose();
      }
    };

    const setEditable = ({ editable, isAdminView }) => {
      titleInput.disabled = !editable;
      descriptionInput.disabled = !editable;
      dueDateInput.disabled = !editable;
      categoryInput.disabled = !editable;
      addCategoryBtn.disabled = !editable;
      statusInput.disabled = !editable;
      assigneeInput.disabled = !editable || !isAdminView;
      saveBtn.disabled = !editable;
      saveBtn.classList.toggle("hidden", !editable);
      deleteBtn.disabled = !editable;
      deleteBtn.classList.toggle("hidden", !editable || mode === "create");
    };

    const setSelectOptions = (node, refs, labelKey, selectedId) => {
      node.innerHTML = refs
        .map(
          (item) =>
            `<option value="${escapeHtml(item._id)}" ${
              item._id === selectedId ? "selected" : ""
            }>${escapeHtml(item[labelKey])}</option>`
        )
        .join("");
    };

    const setAssigneeOptions = (usersRef, selectedUserId, selectedUsername) => {
      if (usersRef.length) {
        setSelectOptions(assigneeInput, usersRef, "username", selectedUserId || "");
        return;
      }
      assigneeInput.innerHTML = `<option value="${escapeHtml(selectedUserId || "")}">${escapeHtml(
        selectedUsername || "Moi"
      )}</option>`;
    };

    const openEdit = ({ task, editable, isAdminView, categoriesRef, statusesRef, usersRef }) => {
      mode = "edit";
      selectedTaskId = task._id;
      titleNode.textContent = "Detail de la task";
      showFeedback("");

      titleInput.value = task.title || "";
      descriptionInput.value = task.description || "";
      dueDateInput.value = normalizeDateOnly(task.dueDate);
      ownerNode.textContent = task.idUser?.username || "-";
      idNode.textContent = task._id || "-";

      const categoryId = task.idCategory?._id || task.idCategory?.id || "";
      const statusId = task.idStatu?._id || task.idStatu?.id || "";
      const ownerId = task.idUser?._id || task.idUser?.id || task.idUser || "";

      setSelectOptions(categoryInput, categoriesRef, "name", categoryId);
      setSelectOptions(statusInput, statusesRef, "label", statusId);
      setAssigneeOptions(usersRef, ownerId, task.idUser?.username);

      setEditable({ editable, isAdminView });
      permissionNode.textContent = editable
        ? isAdminView
          ? "Tu peux modifier cette task et changer son attribution."
          : "Tu peux modifier cette task."
        : "Lecture seule: seule la personne owner (ou un admin) peut modifier.";

      modal.classList.remove("hidden");
    };

    const openCreate = ({ currentUser, isAdminView, categoriesRef, statusesRef, usersRef }) => {
      mode = "create";
      selectedTaskId = null;
      titleNode.textContent = "Creer une task";
      showFeedback("");

      titleInput.value = "";
      descriptionInput.value = "";
      dueDateInput.value = "";
      ownerNode.textContent = currentUser?.username || "-";
      idNode.textContent = "-";

      setSelectOptions(categoryInput, categoriesRef, "name", categoriesRef[0]?._id || "");
      setSelectOptions(statusInput, statusesRef, "label", statusesRef[0]?._id || "");

      const currentUserId = currentUser?.id || currentUser?._id || "";
      const currentUsername = currentUser?.username || "Moi";
      setAssigneeOptions(usersRef, currentUserId, currentUsername);

      setEditable({ editable: true, isAdminView });
      deleteBtn.classList.add("hidden");
      permissionNode.textContent = isAdminView
        ? "Creation d'une nouvelle task avec attribution configurable."
        : "Creation d'une nouvelle task pour ton compte.";

      modal.classList.remove("hidden");
    };

    const updateCategories = (categoriesRef, selectedCategoryId) => {
      setSelectOptions(categoryInput, categoriesRef, "name", selectedCategoryId);
    };

    const getValues = () => ({
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      dueDate: dueDateInput.value,
      idCategory: categoryInput.value,
      idStatu: statusInput.value,
      idUser: assigneeInput.value,
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!callbacks.onSubmit) {
        return;
      }
      await callbacks.onSubmit({
        mode,
        taskId: selectedTaskId,
        values: getValues(),
      });
    });

    addCategoryBtn.addEventListener("click", () => {
      if (callbacks.onAddCategory) {
        callbacks.onAddCategory();
      }
    });

    deleteBtn.addEventListener("click", async () => {
      if (!callbacks.onDelete || !selectedTaskId || mode !== "edit") {
        return;
      }
      await callbacks.onDelete({ taskId: selectedTaskId });
    });

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        close();
      }
    });

    return {
      openEdit,
      openCreate,
      close,
      showFeedback,
      updateCategories,
    };
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

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

  window.createTaskModalManager = createTaskModalManager;
})();
