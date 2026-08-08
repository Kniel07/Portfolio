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
function initReveal() {
  const targets = document.querySelectorAll(".section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((target) => observer.observe(target));
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

// ---------- Hidden résumé template selector ----------
// Trigger: 9 consecutive clicks/taps on the footer copyright, within ~2.5s of
// each other. Not visually hinted — the footer stays a normal copyright line.
(function initResumeEasterEgg() {
  const trigger = document.getElementById("footer-copyright");
  const backdrop = document.getElementById("resume-sheet-backdrop");
  const closeBtn = document.getElementById("resume-sheet-close");
  if (!trigger || !backdrop || !closeBtn) return;

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

  let lastFocused = null;
  function openSheet() {
    lastFocused = document.activeElement;
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
