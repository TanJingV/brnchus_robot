(() => {
  const dialog = document.querySelector("#figure-dialog");
  const dialogImage = document.querySelector("#figure-dialog-image");
  const dialogCaption = document.querySelector("#figure-dialog-caption");
  const closeButton = document.querySelector("#figure-dialog-close");

  if (!dialog || !dialogImage || !dialogCaption || !closeButton) return;

  const openFigure = (image) => {
    const figure = image.closest("figure");
    const caption = figure?.querySelector("figcaption")?.textContent?.trim() || image.alt;
    dialogImage.src = image.currentSrc || image.src;
    dialogImage.alt = image.alt;
    dialogCaption.textContent = caption;
    dialog.showModal();
    closeButton.focus();
  };

  document.querySelectorAll(".paper-figure img").forEach((image) => {
    const figure = image.closest("figure");
    figure?.classList.add("is-zoomable");
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `Enlarge figure: ${image.alt}`);
    image.addEventListener("click", () => openFigure(image));
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openFigure(image);
    });
  });

  const closeDialog = () => {
    dialog.close();
    dialogImage.removeAttribute("src");
  };

  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
})();
