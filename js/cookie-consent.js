/* ==========================================================================
   VSHARE T&T — cookie-consent.js
   Simple cookie consent banner. Stores the visitor's choice in localStorage
   so the banner does not reappear once a decision has been made.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var STORAGE_KEY = "vshareCookieConsent";
  var banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  var acceptBtn = banner.querySelector("[data-cookie-accept]");
  var rejectBtn = banner.querySelector("[data-cookie-reject]");

  function getStoredConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function storeConsent(choice) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice: choice, date: new Date().toISOString() })
      );
    } catch (e) {
      /* localStorage unavailable, banner will simply show again next visit */
    }
  }

  function hideBanner() {
    banner.classList.remove("is-visible");
  }

  function showBanner() {
    /* Small delay so the banner slides in after the page has settled */
    setTimeout(function () {
      banner.classList.add("is-visible");
    }, 900);
  }

  var existing = getStoredConsent();
  if (!existing) {
    showBanner();
  }

  if (acceptBtn) {
    acceptBtn.addEventListener("click", function () {
      storeConsent("accepted");
      hideBanner();
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", function () {
      storeConsent("rejected");
      hideBanner();
    });
  }
});
