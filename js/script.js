// ---------- Boot sequence ----------
const bootLines = [
  "&gt; INITIALIZING PROFILE_ENGINE...",
  "&gt; LOADING MODULE: EXPERIENCE.dat <span class=\"ok\">[OK]</span>",
  "&gt; LOADING MODULE: PROJECTS.log <span class=\"ok\">[OK]</span>",
  "&gt; LOADING MODULE: SKILLS.cfg <span class=\"ok\">[OK]</span>",
  "&gt; AUTOMATION FRAMEWORKS: 5 ACTIVE",
  "&gt; STATUS: READY",
];

const bootLog = document.getElementById("boot-log");
const bootScreen = document.getElementById("boot-screen");
const app = document.getElementById("app");

function runBootSequence() {
  bootLines.forEach((text, i) => {
    const el = document.createElement("div");
    el.className = "line" + (i === bootLines.length - 1 ? " final" : "");
    el.style.animationDelay = `${i * 0.18}s`;
    el.innerHTML = text;
    bootLog.appendChild(el);
  });

  const totalDelay = bootLines.length * 180 + 500;
  setTimeout(() => {
    bootScreen.classList.add("hide");
    app.hidden = false;
    setTimeout(() => bootScreen.remove(), 550);
    initScrollSpy();
    initReveal();
    initMetricCounters();
  }, totalDelay);
}

// Skip boot animation entirely if user prefers reduced motion
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  bootScreen.remove();
  app.hidden = false;
  initScrollSpy();
  initReveal();
  initMetricCounters();
} else {
  runBootSequence();
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

// ---------- Animated metric counters ----------
function initMetricCounters() {
  const metrics = document.querySelectorAll(".metric-value");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  metrics.forEach((metric) => observer.observe(metric));
}

function animateCounter(el) {
  const target = Number(el.dataset.target);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = 900;
  const start = performance.now();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
    return;
  }

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
