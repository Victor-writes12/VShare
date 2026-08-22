/* ==========================================================================
   VSHARE T&T — quote.js
   Instant delivery.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async function () {
  const form = document.querySelector("[data-quote-calc-form]");
  if (!form || !window.vshareSupabase) return;

  const pickupSelect = document.querySelector("[data-quote-pickup]");
  const deliverySelect = document.querySelector("[data-quote-delivery]");
  const sizeSelect = document.querySelector("[data-quote-size]");
  const resultPanel = document.querySelector("[data-quote-result]");
  const errorNote = document.querySelector("[data-quote-error]");
  const submitBtn = form.querySelector("button[type='submit']");

  // Populate the area dropdowns, grouped by zone
  const { data: neighborhoods } = await window.vshareSupabase
    .from("neighborhoods")
    .select("name, zone")
    .order("zone")
    .order("name");

  if (neighborhoods && neighborhoods.length) {
    const zoneLabels = {
      A: "Mainland Core",
      B: "Mainland Outer",
      C: "Mainland Extreme",
      D: "Island Core",
      E: "Island Extreme"
    };

    [pickupSelect, deliverySelect].forEach(function (select) {
      if (!select) return;
      let currentZone = null;
      let optgroup = null;

      neighborhoods.forEach(function (n) {
        if (n.zone !== currentZone) {
          currentZone = n.zone;
          optgroup = document.createElement("optgroup");
          optgroup.label = zoneLabels[n.zone] || n.zone;
          select.appendChild(optgroup);
        }
        const option = document.createElement("option");
        option.value = n.name;
        option.textContent = n.name;
        optgroup.appendChild(option);
      });
    });
  }

  // Populate the package size dropdown, e.g. "Small (Can fit inside a shoe box)"
  const { data: sizes } = await window.vshareSupabase
    .from("package_sizes")
    .select("code, label, description")
    .order("sort_order");

  if (sizes && sizes.length && sizeSelect) {
    sizes.forEach(function (s) {
      const option = document.createElement("option");
      option.value = s.code;
      option.textContent = s.label + " (" + s.description + ")";
      sizeSelect.appendChild(option);
    });
  }

  function showError(message) {
    if (!errorNote) return;
    errorNote.textContent = message;
    errorNote.style.display = "block";
  }

  function clearError() {
    if (errorNote) errorNote.style.display = "none";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError();
    if (resultPanel) resultPanel.classList.remove("is-visible");

    const pickup = pickupSelect.value;
    const delivery = deliverySelect.value;
    const size = sizeSelect ? sizeSelect.value : "";

    if (!pickup || !delivery || !size) {
      showError("Select a pickup area, delivery area and package size.");
      return;
    }

    if (pickup === delivery) {
      showError("Pickup and delivery areas cannot be the same.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Calculating...";
    }

    const { data, error } = await window.vshareSupabase.rpc("get_delivery_quote", {
      p_pickup: pickup,
      p_delivery: delivery,
      p_size: size
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Get Instant Quote";
    }

    if (error || !data || !data[0]) {
      showError("Something went wrong calculating your quote. Please try again.");
      return;
    }

    const quote = data[0];

    if (!quote.matched) {
      showError(
        "We don't have a fixed rate for that route yet. Please contact us directly for a custom quote."
      );
      return;
    }

    document.querySelector("[data-quote-total]").textContent =
      "\u20A6" + Number(quote.final_price).toLocaleString("en-NG");
    document.querySelector("[data-quote-window]").textContent = quote.estimated_window_label;
    document.querySelector("[data-quote-route]").textContent = pickup + " \u2192 " + delivery;

    if (resultPanel) resultPanel.classList.add("is-visible");
  });
});