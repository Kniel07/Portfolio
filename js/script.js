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
