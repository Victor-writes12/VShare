/* ==========================================================================
   VSHARE T&T — main.js
   Preloader, sticky nav, mobile menu, stat counters, current year
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  /* ---- Preloader ---- */
  var preloader = document.querySelector(".preloader");
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }
  window.addEventListener("load", function () {
    setTimeout(hidePreloader, 350);
  });
  /* Fallback in case the load event is delayed by a heavy video file */
  setTimeout(hidePreloader, 3500);

  /* ---- Sticky header ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("is-open");
      links.classList.toggle("is-open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        toggle.classList.remove("is-open");
        links.classList.remove("is-open");
      });
    });
  }
    var closeBtn = document.querySelector("[data-nav-close]");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      toggle.classList.remove("is-open");
      links.classList.remove("is-open");
    });
  }

  /* ---- Stat counters ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 1400;
          var start = null;

          function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = target * eased;
            el.textContent =
              (target % 1 === 0 ? Math.floor(value) : value.toFixed(1)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (c) {
      counterObserver.observe(c);
    });
  }

  /* ---- Current year in footer ---- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Testimonial carousel controls ---- */
  var track = document.querySelector(".testimonial-track");
  var prevBtn = document.querySelector("[data-testimonial-prev]");
  var nextBtn = document.querySelector("[data-testimonial-next]");
  if (track && prevBtn && nextBtn) {
    var scrollAmount = function () {
      var card = track.querySelector(".testimonial");
      return card ? card.getBoundingClientRect().width + 28 : 400;
    };
    prevBtn.addEventListener("click", function () {
      track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
  }

  /* ---- Newsletter and contact form guard (no backend wired yet) ---- */
  document.querySelectorAll("[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      if (note) {
        note.textContent = "Thanks. Your message has been queued for our team.";
        note.style.display = "block";
      }
      form.reset();
    });
  });
});
