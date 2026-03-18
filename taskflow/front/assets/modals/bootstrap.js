(async () => {
  const root = document.getElementById("modals-root");
  if (!root) {
    return;
  }

  const loadHtml = async (path) => {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Impossible de charger ${path}`);
    }
    return res.text();
  };

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      document.body.appendChild(script);
    });

  try {
    const [taskModalHtml, categoryModalHtml] = await Promise.all([
      loadHtml("./partials/task-modal.html"),
      loadHtml("./partials/category-modal.html"),
    ]);

    root.innerHTML = `${taskModalHtml}\n${categoryModalHtml}`;

    await loadScript("../assets/modals/category.modal.js");
    await loadScript("../assets/modals/task.modal.js");
    await loadScript("../assets/dashboard.js");
  } catch (error) {
    console.error(error);
    root.innerHTML =
      '<p style="color:#dc2626;padding:12px">Erreur de chargement des modales.</p>';
  }
})();
