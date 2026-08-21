/* ==========================================================================
   VSHARE T&T — promo.js
   Shows a popup driven entirely by the "promos" table in Supabase. Create
   a row there to show something new, no code changes needed. Each promo
   is shown once per visitor (remembered by its own id), so creating a new
   promo automatically shows it again even to returning visitors.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  if (!window.vshareSupabase) return;

  const nowIso = new Date().toISOString();

  const { data, error } = await window.vshareSupabase
    .from("promos")
    .select("*")
    .eq("is_active", true)
    .or("starts_at.is.null,starts_at.lte." + nowIso)
    .or("ends_at.is.null,ends_at.gte." + nowIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return;

  const promo = data[0];
  const countKey = "vsharePromoShownCount_" + promo.id;
  const shownCount = parseInt(localStorage.getItem(countKey) || "0", 10);
  if (shownCount >= 3) return;
  localStorage.setItem(countKey, String(shownCount + 1));

  const overlay = document.createElement("div");
  overlay.className = "promo-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", promo.title);

  const imageBlock = promo.image_url
    ? '<div class="promo-modal__image"><img src="' + promo.image_url + '" alt=""></div>'
    : "";

  const badgeBlock = promo.badge_text
    ? '<span class="promo-modal__badge">' + promo.badge_text + "</span>"
    : "";

  const ctaBlock = promo.cta_text && promo.cta_url
    ? '<a href="' + promo.cta_url + '" class="btn btn-primary promo-modal__cta">' + promo.cta_text + "</a>"
    : '<button type="button" class="btn btn-dark promo-modal__cta" data-promo-dismiss>I Understand</button>';

  overlay.innerHTML =
    '<div class="promo-modal">' +
      '<button type="button" class="promo-modal__close" data-promo-dismiss aria-label="Close">' +
        '<i class="fa-solid fa-xmark"></i>' +
      "</button>" +
      imageBlock +
      '<div class="promo-modal__body">' +
        badgeBlock +
        "<h3>" + promo.title + "</h3>" +
        "<p>" + promo.message + "</p>" +
        ctaBlock +
      "</div>" +
    "</div>";

  document.body.appendChild(overlay);

  function dismiss() {
    overlay.classList.remove("is-visible");
    setTimeout(function () {
      overlay.remove();
    }, 300);
  }

  overlay.querySelectorAll("[data-promo-dismiss]").forEach(function (btn) {
    btn.addEventListener("click", dismiss);
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) dismiss();
  });

  setTimeout(function () {
    overlay.classList.add("is-visible");
  }, 700);
});
