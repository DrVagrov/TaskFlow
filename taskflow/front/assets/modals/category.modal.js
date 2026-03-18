(() => {
  function createCategoryModalManager(elements, callbacks = {}) {
    const {
      modal,
      backdrop,
      form,
      feedback,
      nameInput,
      closeBtn,
      saveBtn,
    } = elements;

    const showFeedback = (message) => {
      feedback.textContent = message || "";
    };

    const open = () => {
      showFeedback("");
      nameInput.value = "";
      modal.classList.remove("hidden");
      nameInput.focus();
    };

    const close = () => {
      modal.classList.add("hidden");
      showFeedback("");
      if (callbacks.onClose) {
        callbacks.onClose();
      }
    };

    const setSaving = (isSaving) => {
      saveBtn.disabled = Boolean(isSaving);
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!callbacks.onSubmit) {
        return;
      }
      await callbacks.onSubmit(nameInput.value.trim());
    });

    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        close();
      }
    });

    return {
      open,
      close,
      showFeedback,
      setSaving,
    };
  }

  window.createCategoryModalManager = createCategoryModalManager;
})();
