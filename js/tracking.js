/* ==========================================================================
   VSHARE T&T — tracking.js
   Front end only shipment tracking demo. Swap the demoLookup function
   for a real API call once a tracking backend is connected.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("[data-tracking-form]");
  if (!form) return;

  var input = form.querySelector("input");
  var resultPanel = document.querySelector("[data-tracking-result]");
  var statusList = document.querySelector("[data-tracking-steps]");
  var summaryId = document.querySelector("[data-tracking-id]");
  var summaryEta = document.querySelector("[data-tracking-eta]");
  var errorNote = document.querySelector("[data-tracking-error]");

  var steps = [
    { key: "warehouse", label: "Picked up at warehouse", detail: "Lagos distribution hub" },
    { key: "transit", label: "In transit", detail: "Moving through regional network" },
    { key: "hub", label: "Arrived at distribution center", detail: "Sorting and load balancing" },
    { key: "delivery", label: "Out for delivery", detail: "On the final leg to destination" }
  ];

  function demoLookup(trackingId) {
    /* Deterministic demo state so the same code always shows a
       consistent progress stage. Replace with a live fetch call. */
    var seed = 0;
    for (var i = 0; i < trackingId.length; i++) {
      seed += trackingId.charCodeAt(i);
    }
    var activeIndex = seed % steps.length;
    return { activeIndex: activeIndex };
  }

  function renderSteps(activeIndex) {
    statusList.innerHTML = "";
    steps.forEach(function (step, index) {
      var li = document.createElement("li");
      li.className =
        "route-visual__point" + (index <= activeIndex ? " is-active" : "");
      var strong = document.createElement("strong");
      strong.textContent = step.label;
      var span = document.createElement("span");
      span.textContent = step.detail;
      li.appendChild(strong);
      li.appendChild(span);
      statusList.appendChild(li);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = input.value.trim();

    if (!value) {
      if (errorNote) {
        errorNote.textContent = "Enter a tracking number to continue.";
        errorNote.style.display = "block";
      }
      return;
    }

    if (errorNote) errorNote.style.display = "none";

    var result = demoLookup(value);
    renderSteps(result.activeIndex);

    if (summaryId) summaryId.textContent = value.toUpperCase();
    if (summaryEta) {
      var etaDays = steps.length - result.activeIndex;
      summaryEta.textContent =
        etaDays <= 1 ? "Arriving today" : "Arriving in about " + etaDays + " days";
    }
    if (resultPanel) resultPanel.classList.add("is-visible");
  });
});
