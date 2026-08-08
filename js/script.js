// ---------- Theme switcher ----------
// The inline script in <head> already resolved and applied the theme before
// first paint (no flash of the wrong theme); this module just wires up the
// visible control and keeps "system" live if the OS theme changes mid-session.
(function initThemeSwitcher() {
  const THEME_KEY = "theme";
  const buttons = document.querySelectorAll(".theme-btn");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  if (!buttons.length) return;

  function getStoredPref() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
    } catch (e) {
      // localStorage unavailable — fall through to default.
    }
    return "system";
  }

  function resolve(pref) {
    return pref === "system" ? (media.matches ? "dark" : "light") : pref;
  }

  function applyTheme(pref) {
    document.documentElement.setAttribute("data-theme", resolve(pref));
    buttons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.themeChoice === pref));
    });
  }

  let currentPref = getStoredPref();
  applyTheme(currentPref);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPref = btn.dataset.themeChoice;
      try {
        localStorage.setItem(THEME_KEY, currentPref);
      } catch (e) {
        // localStorage unavailable — selection still applies for this page view.
      }
      applyTheme(currentPref);
    });
  });

  media.addEventListener("change", () => {
    if (currentPref === "system") applyTheme("system");
  });
})();

// ---------- Project evidence gallery ----------
// Each project card that has real evidence images wraps its snapshot <img>
// in a <button class="project-snapshot-btn"> and carries a sibling
// <script type="application/json" class="project-gallery-data"> with the
// [{src, caption}, ...] list. Only that image button opens the gallery —
// the rest of the card (title, tags, case-study) is untouched.
(function initProjectGallery() {
  const backdrop = document.getElementById("gallery-backdrop");
  const imageEl = document.getElementById("gallery-image");
  const projectEl = document.getElementById("gallery-project");
  const captionEl = document.getElementById("gallery-caption");
  const counterEl = document.getElementById("gallery-counter");
  const closeBtn = document.getElementById("gallery-close");
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  const triggers = document.querySelectorAll(".project-snapshot-btn");
  if (!backdrop || !triggers.length) return;

  let currentImages = [];
  let currentIndex = 0;
  let currentProjectName = "";
  let lastFocused = null;

  function render() {
    const item = currentImages[currentIndex];
    imageEl.src = item.src;
    imageEl.alt = currentProjectName + " — " + item.caption;
    projectEl.textContent = currentProjectName;
    captionEl.textContent = item.caption;
    counterEl.textContent = (currentIndex + 1) + " / " + currentImages.length;
    const multi = currentImages.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  }

  function open(images, projectName, startIndex, triggerEl) {
    currentImages = images;
    currentProjectName = projectName;
    currentIndex = startIndex;
    lastFocused = triggerEl;
    render();
    backdrop.classList.add("open");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    backdrop.classList.remove("open");
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function step(delta) {
    currentIndex = (currentIndex + delta + currentImages.length) % currentImages.length;
    render();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  }

  triggers.forEach((btn) => {
    const dataEl = btn.parentElement.querySelector(".project-gallery-data");
    if (!dataEl) return;
    let images;
    try {
      images = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    if (!Array.isArray(images) || !images.length) return;
    const nameEl = btn.parentElement.querySelector("h3");
    const projectName = nameEl ? nameEl.textContent.trim() : "";
    btn.addEventListener("click", () => open(images, projectName, 0, btn));
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
})();

// ---------- Boot ----------
// Brief fade only — no terminal animation, per the site's "mature professional,
// not a tech demo" design direction.
const bootScreen = document.getElementById("boot-screen");
const app = document.getElementById("app");

function reveal() {
  bootScreen.classList.add("hide");
  app.hidden = false;
  setTimeout(() => bootScreen.remove(), 450);
  initScrollSpy();
  initReveal();
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  bootScreen.remove();
  app.hidden = false;
  initScrollSpy();
  initReveal();
} else {
  setTimeout(reveal, 120);
}

// ---------- Scroll-spy nav ----------
function initScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".railnav-list a");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("active"));
          const activeLink = document.querySelector(`.railnav-list a[data-section="${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add("active");
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

// ---------- Scroll reveal ----------
// Content is visible by default (see .section / .reveal-item in
// css/styles.css) — this only ever ADDS a temporary hidden state right
// before animating an element in, and only for elements/thresholds it can
// guarantee will actually resolve. If IntersectionObserver is unavailable
// or the user prefers reduced motion, nothing is hidden and every section
// stays visible as normal HTML/CSS content, no JS required.
function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function arm(el, threshold, rootMargin) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already on screen — leave visible
    el.classList.add("reveal-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
  }

  // Projects is long enough on mobile that a whole-section threshold can
  // become mathematically unreachable on short viewports, so it reveals
  // per-card instead — each card is small enough for the threshold to
  // always be satisfiable, and the section itself is never hidden.
  document.querySelectorAll("#projects .project-card").forEach((card) => {
    arm(card, 0.1, "0px");
  });

  // Shorter sections reveal as a whole. No negative bottom rootMargin here:
  // #contact is the last element on the page, so there is no extra scroll
  // room below it — a shrunk-root margin could make its threshold
  // unreachable once the page is scrolled to its natural end.
  document.querySelectorAll("#experience, #capabilities, #contact").forEach((section) => {
    arm(section, 0.05, "0px");
  });
}

// ---------- Download Résumé dropdown ----------
(function initDownloadMenu() {
  const toggle = document.getElementById("download-toggle");
  const panel = document.getElementById("download-panel");
  if (!toggle || !panel) return;

  function close() {
    panel.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  function open() {
    panel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.classList.contains("open")) close();
    else open();
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== toggle) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// ---------- Résumé design selection ----------
// Two designs exist for the same, unchanged résumé content: "modern" (the
// site's current design) and "classic" (an alternate executive layout,
// the default for anyone who never finds the Easter egg). Whichever one
// is applied here is what BOTH résumé formats (PDF and Word) download as,
// via the normal "Download Résumé" button — this module only ever decides
// the design; format stays a separate, later choice.
const RESUME_TEMPLATES = {
  modern: {
    name: "Modern — Current",
    pdf: "resume/current/resume.pdf",
    docx: "resume/current/resume.docx",
  },
  classic: {
    name: "Classic / Executive",
    pdf: "resume/templates/classic/resume.pdf",
    docx: "resume/templates/classic/resume.docx",
  },
};
const RESUME_TEMPLATE_STORAGE_KEY = "resumeTemplate";

function getStoredResumeTemplate() {
  try {
    const stored = localStorage.getItem(RESUME_TEMPLATE_STORAGE_KEY);
    if (stored && RESUME_TEMPLATES[stored]) return stored;
  } catch (e) {
    // localStorage unavailable (private mode, disabled, etc.) — fall through to default.
  }
  return "classic";
}

function applyResumeTemplateToDownloads(key) {
  const template = RESUME_TEMPLATES[key] || RESUME_TEMPLATES.classic;
  const pdfLink = document.querySelector('#download-panel a[data-fmt="pdf"]');
  const docxLink = document.querySelector('#download-panel a[data-fmt="docx"]');
  if (pdfLink) pdfLink.href = template.pdf;
  if (docxLink) docxLink.href = template.docx;
}

// Reflect whatever design was previously applied (or the "classic" default)
// on every page load, so the hero Download Résumé button is always correct
// even if the visitor never opens the Easter egg this session.
applyResumeTemplateToDownloads(getStoredResumeTemplate());

// ---------- Hidden résumé design selector (Easter egg) ----------
// Trigger: 9 consecutive clicks/taps on the footer copyright, within ~2.5s of
// each other. Not visually hinted — the footer stays a normal copyright line.
(function initResumeEasterEgg() {
  const trigger = document.getElementById("footer-copyright");
  const backdrop = document.getElementById("resume-sheet-backdrop");
  const closeBtn = document.getElementById("resume-sheet-close");
  const form = document.getElementById("resume-template-form");
  const applyBtn = document.getElementById("resume-apply-btn");
  const confirmBox = document.getElementById("resume-confirm");
  const confirmName = document.getElementById("resume-confirm-name");
  const continueBtn = document.getElementById("resume-confirm-continue");
  if (!trigger || !backdrop || !closeBtn || !form || !applyBtn || !confirmBox || !continueBtn) return;

  const REQUIRED_HITS = 9;
  const RESET_MS = 2500;
  let hits = 0;
  let resetTimer = null;

  function registerHit() {
    hits += 1;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { hits = 0; }, RESET_MS);
    if (hits >= REQUIRED_HITS) {
      hits = 0;
      clearTimeout(resetTimer);
      openSheet();
    }
  }

  trigger.addEventListener("click", registerHit);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      registerHit();
    }
  });

  function updateSelectedCardState() {
    document.querySelectorAll(".resume-template-card").forEach((card) => {
      const radio = card.querySelector('input[type="radio"]');
      card.classList.toggle("is-selected", !!radio && radio.checked);
    });
  }

  function resetToSelectionView() {
    const current = getStoredResumeTemplate();
    const radio = form.querySelector('input[type="radio"][value="' + current + '"]');
    if (radio) radio.checked = true;
    updateSelectedCardState();
    form.hidden = false;
    applyBtn.hidden = false;
    confirmBox.hidden = true;
  }

  form.addEventListener("change", updateSelectedCardState);

  applyBtn.addEventListener("click", () => {
    const selected = form.elements["resume-template"].value;
    try {
      localStorage.setItem(RESUME_TEMPLATE_STORAGE_KEY, selected);
    } catch (e) {
      // localStorage unavailable — selection still applies for this page view.
    }
    applyResumeTemplateToDownloads(selected);

    confirmName.textContent = RESUME_TEMPLATES[selected].name;
    form.hidden = true;
    applyBtn.hidden = true;
    confirmBox.hidden = false;
    continueBtn.focus();
  });

  continueBtn.addEventListener("click", closeSheet);

  let lastFocused = null;
  function openSheet() {
    lastFocused = document.activeElement;
    resetToSelectionView();
    backdrop.classList.add("open");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }
  function closeSheet() {
    backdrop.classList.remove("open");
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }
  function onKeydown(e) {
    if (e.key === "Escape") closeSheet();
  }

  closeBtn.addEventListener("click", closeSheet);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeSheet();
  });
})();
