/* ==============================================
   VSHARE T&T — tracking.js
   Live shipment tracking, backed by Supabase.
   ============================================== */

const SUPABASE_URL = "https://dhsjjkthaneycrtzbjqz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoc2pqa3RoYW5leWNydHpianF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzE0NDUsImV4cCI6MjEwMjQ0NzQ0NX0.k4egqT42ncIeJCM9ddIxJnZga0-WA4Ely4mDQ_lOUE0";

const STATUS_LABELS = {
  booked: { label: "Booked", detail: "Shipment created and awaiting pickup" },
  picked_up: { label: "Picked Up", detail: "Collected from pickup location" },
  in_transit: { label: "In Transit", detail: "Moving through our network" },
  arrived_hub: { label: "Arrived At Distribution Center", detail: "Sorted for onward routing" },
  out_for_delivery: { label: "Out For Delivery", detail: "On the final leg to destination" },
  delivered: { label: "Delivered", detail: "Shipment has arrived" },
  cancelled: { label: "Cancelled", detail: "This shipment was cancelled" }
};

const STATUS_ORDER = [
  "booked", "picked_up", "in_transit",
  "arrived_hub", "out_for_delivery", "delivered"
];

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("[data-tracking-form]");
  if (!form) return;

  const input = form.querySelector("input");
  const submitBtn = form.querySelector("button[type='submit']");
  const resultPanel = document.querySelector("[data-tracking-result]");
  const stepsList = document.querySelector("[data-tracking-steps]");
  const summaryId = document.querySelector("[data-tracking-id]");
  const summaryEta = document.querySelector("[data-tracking-eta]");
  const errorNote = document.querySelector("[data-tracking-error]");

  let supabaseClient = null;
  if (window.supabase && SUPABASE_URL.indexOf("YOUR_SUPABASE") === -1) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function showError(message) {
    if (!errorNote) return;
    errorNote.textContent = message;
    errorNote.style.display = "block";
  }

  function clearError() {
    if (errorNote) errorNote.style.display = "none";
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Searching..." : "Track Shipment";
  }

  function renderTimeline(rows) {
    stepsList.innerHTML = "";

    const seenStatuses = rows
      .filter(function (r) { return r.event_status; })
      .map(function (r) { return r.event_status; });

    const currentStatus = rows[0].current_status;
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);

    STATUS_ORDER.forEach(function (statusKey, index) {
      const meta = STATUS_LABELS[statusKey] || { label: statusKey, detail: "" };
      const eventRow = rows.find(function (r) { return r.event_status === statusKey; });

      const li = document.createElement("li");
      const isReached = index <= currentIndex;
      li.className = "route-visual__point" + (isReached ? " is-active" : "");

      const strong = document.createElement("strong");
      strong.textContent = meta.label;

      const span = document.createElement("span");
      if (eventRow && eventRow.event_location) {
        span.textContent = eventRow.event_location;
      } else if (eventRow && eventRow.event_note) {
        span.textContent = eventRow.event_note;
      } else {
        span.textContent = meta.detail;
      }

      li.appendChild(strong);
      li.appendChild(span);
      stepsList.appendChild(li);
    });

    if (currentStatus === "cancelled") {
      const li = document.createElement("li");
      li.className = "route-visual__point is-active";
      const strong = document.createElement("strong");
      strong.textContent = "Cancelled";
      const span = document.createElement("span");
      span.textContent = "This shipment was cancelled";
      li.appendChild(strong);
      li.appendChild(span);
      stepsList.appendChild(li);
    }
  }

  async function lookupShipment(trackingNumber) {
    if (!supabaseClient) {
      showError(
        "Tracking is not fully connected yet. Add your Supabase project URL and key in js/tracking.js."
      );
      return;
    }

    setLoading(true);
    clearError();
    if (resultPanel) resultPanel.classList.remove("is-visible");

    const { data, error } = await supabaseClient.rpc("track_shipment", {
      p_tracking_number: trackingNumber
    });

    setLoading(false);

    if (error) {
      showError("Something went wrong while looking up that shipment. Please try again.");
      return;
    }

    if (!data || data.length === 0) {
      showError("No shipment found for that tracking number. Please check it and try again.");
      return;
    }

    if (summaryId) summaryId.textContent = data[0].tracking_number.toUpperCase();
    if (summaryEta) {
      const meta = STATUS_LABELS[data[0].current_status];
      summaryEta.textContent = meta ? meta.label : data[0].current_status;
    }

    renderTimeline(data);
    if (resultPanel) resultPanel.classList.add("is-visible");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const value = input.value.trim();

    if (!value) {
      showError("Enter a tracking number to continue.");
      return;
    }

    lookupShipment(value);
  });
});