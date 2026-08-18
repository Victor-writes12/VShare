/* ==========================================================================
   VSHARE T&T — tracking.js
   Live shipment tracking, backed by Supabase.
   Uses the shared Supabase client created in js/auth.js, so make sure
   auth.js loads before this file.
   ========================================================================== */

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
  const summaryReceiver = document.querySelector("[data-tracking-receiver]");
  const summaryCargo = document.querySelector("[data-tracking-cargo]");
  const summaryPickup = document.querySelector("[data-tracking-pickup]");
  const summaryDestination = document.querySelector("[data-tracking-destination]");
  const errorNote = document.querySelector("[data-tracking-error]");

  let supabaseClient = window.vshareSupabase || null;

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

    const currentStatus = rows[0].current_status;
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const fragment = document.createDocumentFragment();

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
      fragment.appendChild(li);
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
      fragment.appendChild(li);
    }

    stepsList.appendChild(fragment);
  }

  async function lookupShipment(trackingNumber) {
    if (!supabaseClient) {
      supabaseClient = window.vshareSupabase || null;
    }

    if (!supabaseClient) {
      showError(
        "Tracking is not connected yet. Check that js/auth.js is loaded before js/tracking.js."
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
    if (summaryReceiver) summaryReceiver.textContent = data[0].receiver_name || "Not provided";
    if (summaryCargo) summaryCargo.textContent = data[0].cargo_description || "Not specified";
    if (summaryPickup) summaryPickup.textContent = data[0].pickup_address || "Not specified";
    if (summaryDestination) summaryDestination.textContent = data[0].destination_address || "Not specified";

    renderTimeline(data);
    if (resultPanel) resultPanel.classList.add("is-visible");
    window.vshareSendTrackingNotification(data[0]);
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
