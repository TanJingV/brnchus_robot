(() => {
  const root = document.querySelector(".showcase-hero");
  if (!root) return;

  const slides = [...root.querySelectorAll(".showcase-slide")];
  const dots = root.querySelector(".showcase-dots");
  const previous = root.querySelector("#showcase-prev");
  const next = root.querySelector("#showcase-next");
  const currentLabel = root.querySelector("#showcase-current");
  const currentName = root.querySelector("#showcase-name");
  const dialog = document.querySelector("#video-dialog");
  const dialogVideo = document.querySelector("#dialog-video");
  const dialogTitle = document.querySelector("#dialog-video-title");
  const dialogLabel = document.querySelector("#dialog-video-label");
  const dialogClose = document.querySelector("#video-dialog-close");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let timer = 0;
  let pointerStart = null;
  let carouselVisible = true;

  const dotButtons = slides.map((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "showcase-dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show video ${index + 1}: ${slide.dataset.title}`);
    dot.addEventListener("click", () => selectSlide(index, true));
    dots.append(dot);
    return dot;
  });

  function relativeSlot(index) {
    let delta = index - activeIndex;
    if (delta > slides.length / 2) delta -= slides.length;
    if (delta < -slides.length / 2) delta += slides.length;
    return delta;
  }

  function loadAndPlay(video) {
    if (!video.src) {
      video.src = video.dataset.src;
      video.load();
    }
    const start = Number(video.dataset.start || 0);
    const seek = () => {
      if (start > 0 && video.currentTime < start) video.currentTime = start;
      video.play().catch(() => {});
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
  }

  function selectSlide(index, userInitiated = false) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      const slot = relativeSlot(slideIndex);
      const video = slide.querySelector("video");
      slide.style.setProperty("--slot", slot);
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active && Math.abs(slot) > 1));
      slide.querySelector(".showcase-select").tabIndex = Math.abs(slot) <= 1 ? 0 : -1;
      slide.querySelector(".showcase-watch").tabIndex = active ? 0 : -1;
      if (active && carouselVisible) loadAndPlay(video);
      else video.pause();
    });
    dotButtons.forEach((dot, dotIndex) => dot.setAttribute("aria-selected", String(dotIndex === activeIndex)));
    currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    currentName.textContent = slides[activeIndex].dataset.title;
    if (userInitiated) restartTimer();
  }

  function restartTimer() {
    window.clearTimeout(timer);
    if (!reduceMotion.matches && !dialog.open && carouselVisible) {
      timer = window.setTimeout(() => {
        selectSlide(activeIndex + 1);
        restartTimer();
      }, 8500);
    }
  }

  function openVideo(slide) {
    window.clearTimeout(timer);
    slides[activeIndex].querySelector("video").pause();
    dialogVideo.poster = slide.querySelector("video").poster;
    dialogVideo.src = slide.dataset.src;
    dialogTitle.textContent = slide.dataset.title;
    dialogLabel.textContent = slide.dataset.label;
    dialog.showModal();
    dialogVideo.play().catch(() => {});
  }

  function closeVideo() {
    dialogVideo.pause();
    dialogVideo.removeAttribute("src");
    dialogVideo.load();
    if (dialog.open) dialog.close();
    loadAndPlay(slides[activeIndex].querySelector("video"));
    restartTimer();
  }

  slides.forEach((slide, index) => {
    slide.querySelector(".showcase-select").addEventListener("click", () => {
      if (index !== activeIndex) selectSlide(index, true);
    });
    slide.querySelector(".showcase-watch").addEventListener("click", () => openVideo(slide));
  });

  previous.addEventListener("click", () => selectSlide(activeIndex - 1, true));
  next.addEventListener("click", () => selectSlide(activeIndex + 1, true));
  dialogClose.addEventListener("click", closeVideo);
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeVideo();
  });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeVideo();
  });

  root.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") selectSlide(activeIndex - 1, true);
    if (event.key === "ArrowRight") selectSlide(activeIndex + 1, true);
  });
  root.addEventListener("mouseenter", () => window.clearTimeout(timer));
  root.addEventListener("mouseleave", restartTimer);
  root.addEventListener("focusin", () => window.clearInterval(timer));
  root.addEventListener("focusout", event => {
    if (!root.contains(event.relatedTarget)) restartTimer();
  });
  root.addEventListener("pointerdown", event => {
    pointerStart = [event.clientX, event.clientY];
  });
  root.addEventListener("pointerup", event => {
    if (!pointerStart) return;
    const horizontal = event.clientX - pointerStart[0];
    const vertical = event.clientY - pointerStart[1];
    pointerStart = null;
    if (Math.abs(horizontal) > 55 && Math.abs(horizontal) > Math.abs(vertical)) {
      selectSlide(activeIndex + (horizontal < 0 ? 1 : -1), true);
    }
  });

  new IntersectionObserver(entries => {
    carouselVisible = entries[0].isIntersecting;
    if (carouselVisible) {
      loadAndPlay(slides[activeIndex].querySelector("video"));
      restartTimer();
    } else {
      slides[activeIndex].querySelector("video").pause();
      window.clearTimeout(timer);
    }
  }, { threshold: 0.2 }).observe(root);

  reduceMotion.addEventListener("change", restartTimer);
  selectSlide(0);
  restartTimer();
})();
