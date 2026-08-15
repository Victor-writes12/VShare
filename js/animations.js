/* ==========================================================================
   VSHARE T&T — animations.js
   Scroll reveal system for section entrances
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
});
