/* ==========================================================================
   VSHARE T&T — email.js
   Handles all outgoing email: quote request notifications, newsletter
   signups, and shipment tracking notifications, all through EmailJS.

   SETUP REQUIRED — fill in your real values below:
   ========================================================================== */

const EMAILJS_PUBLIC_KEY = "3IOre9Aqklh3BcCHd";
const EMAILJS_SERVICE_ID = "service_zm5en9i";
const EMAILJS_TEMPLATE_QUOTE_NOTIFY = "template_4e1u0sq";
const EMAILJS_TEMPLATE_QUOTE_AUTOREPLY = "template_ifnr9d6";
const EMAILJS_TEMPLATE_NEWSLETTER = "YOUR_TEMPLATE_ID_NEWSLETTER";
const EMAILJS_TEMPLATE_TRACKING = "YOUR_TEMPLATE_ID_TRACKING";

if (window.emailjs && EMAILJS_PUBLIC_KEY.indexOf("YOUR_EMAILJS") === -1) {
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

function vshareEmailReady() {
  return window.emailjs && EMAILJS_PUBLIC_KEY.indexOf("YOUR_EMAILJS") === -1;
}

function vshareTemplateReady(templateId) {
  return templateId && templateId.indexOf("YOUR_TEMPLATE") === -1;
}

/* ---- Quote request form (contact.html) ---- */
document.addEventListener("DOMContentLoaded", function () {
  const quoteForm = document.querySelector("[data-quote-form]");
  if (!quoteForm) return;

  quoteForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const note = quoteForm.querySelector("[data-form-note]");
    const submitBtn = quoteForm.querySelector("button[type='submit']");

    if (!vshareEmailReady()) {
      if (note) {
        note.textContent = "Email is not connected yet. Add your EmailJS keys in js/email.js.";
        note.style.display = "block";
      }
      return;
    }

    const params = {
      from_name: (quoteForm.querySelector("#name") || {}).value || "",
      from_email: (quoteForm.querySelector("#email") || {}).value || "",
      phone: (quoteForm.querySelector("#phone") || {}).value || "Not provided",
      company: (quoteForm.querySelector("#company") || {}).value || "Not provided",
      service: (quoteForm.querySelector("#service") || {}).value || "Not specified",
      message: (quoteForm.querySelector("#message") || {}).value || "No message provided"
    };

    if (submitBtn) {
      submitBtn.dataset.originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      // Notify the VSHARE T&T team
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_QUOTE_NOTIFY, params);
      // Send the customer a confirmation
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_QUOTE_AUTOREPLY, params);

      if (note) {
        note.textContent = "Thank you. Your request has been sent, and a confirmation is on its way to your inbox.";
        note.style.color = "#106531";
        note.style.display = "block";
      }
      quoteForm.reset();
    } catch (err) {
      if (note) {
        note.textContent = "Something went wrong sending your request. Please try again or call us directly.";
        note.style.color = "#991b1b";
        note.style.display = "block";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = submitBtn.dataset.originalHtml;
      }
    }
  });
});

/* ---- Newsletter signup form (footer, every page) ---- */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-newsletter-form]").forEach(function (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      const note = form.querySelector("[data-form-note]");
      if (!input || !input.value.trim()) return;

      if (!vshareEmailReady()) {
        if (note) {
          note.textContent = "Newsletter is not connected yet.";
          note.style.display = "block";
        }
        return;
      }

      if (!vshareTemplateReady(EMAILJS_TEMPLATE_NEWSLETTER)) {
        // Newsletter template not created yet, e.g. still on the
        // EmailJS free plan template limit. Show a friendly message
        // instead of attempting a call that would fail.
        if (note) {
          note.textContent = "Thanks, you're on the list! Signups are being finalised, we'll be in touch.";
          note.style.color = "#166534";
          note.style.display = "block";
        }
        form.reset();
        return;
      }

      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_NEWSLETTER, {
          subscriber_email: input.value.trim()
        });
        if (note) {
          note.textContent = "Thanks, you're subscribed.";
          note.style.color = "#166534";
          note.style.display = "block";
        }
        form.reset();
      } catch (err) {
        if (note) {
          note.textContent = "Something went wrong. Please try again.";
          note.style.color = "#991b1b";
          note.style.display = "block";
        }
      }
    });
  });
});

/* ---- Tracking search notification (called from tracking.js) ---- */
window.vshareSendTrackingNotification = async function (shipment) {
  if (!vshareEmailReady()) return;
  if (!vshareTemplateReady(EMAILJS_TEMPLATE_TRACKING)) return;
  if (!shipment || !shipment.receiver_email) return;

  // Guard against emailing the same person repeatedly if they search
  // the same tracking number more than once in one browser session.
  const guardKey = "vshareNotified_" + shipment.tracking_number;
  if (sessionStorage.getItem(guardKey)) return;

  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_TRACKING, {
      to_email: shipment.receiver_email,
      receiver_name: shipment.receiver_name || "there",
      tracking_number: shipment.tracking_number,
      status_label: shipment.status_label || shipment.current_status,
      cargo_description: shipment.cargo_description || "Not specified",
      pickup_address: shipment.pickup_address || "Not specified",
      destination_address: shipment.destination_address || "Not specified",
      tracking_url: window.location.href.split("?")[0] + "?id=" + encodeURIComponent(shipment.tracking_number)
    });
    sessionStorage.setItem(guardKey, "1");
  } catch (err) {
    // Fail silently, a missed notification email should never block
    // the person from seeing their tracking results on screen.
    console.error("Tracking notification email failed:", err);
  }
};
