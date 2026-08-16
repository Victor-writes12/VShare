/* ==========================================================================
   VSHARE T&T — auth.js
   Shared Supabase auth state. Runs on every page. Swaps the nav "Sign In"
   link to "My Shipments" when a customer is logged in, and wires up the
   Sign Out button wherever one exists (dashboard.html).
   ========================================================================== */

const VSHARE_SUPABASE_URL = "https://dhsjjkthaneycrtzbjqz.supabase.co";
const VSHARE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoc2pqa3RoYW5leWNydHpianF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzE0NDUsImV4cCI6MjEwMjQ0NzQ0NX0.k4egqT42ncIeJCM9ddIxJnZga0-WA4Ely4mDQ_lOUE0";

let vshareSupabase = null;
if (window.supabase) {
  vshareSupabase = window.supabase.createClient(
    VSHARE_SUPABASE_URL,
    VSHARE_SUPABASE_ANON_KEY
  );
  window.vshareSupabase = vshareSupabase;
}

async function vshareGetSession() {
  if (!vshareSupabase) return null;
  const { data } = await vshareSupabase.auth.getSession();
  return data.session;
}

document.addEventListener("DOMContentLoaded", async function () {
  if (!vshareSupabase) return;

  const session = await vshareGetSession();
  const authLinks = document.querySelectorAll("[data-auth-link]");

  authLinks.forEach(function (link) {
    if (session) {
      link.textContent = "My Shipments";
      link.setAttribute("href", "dashboard.html");
    } else {
      link.textContent = "Sign In";
      link.setAttribute("href", "login.html");
    }
  });

  const signOutBtn = document.querySelector("[data-sign-out]");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async function () {
      await vshareSupabase.auth.signOut();
      window.location.href = "index.html";
    });
  }

  vshareSupabase.auth.onAuthStateChange(function (_event, newSession) {
    authLinks.forEach(function (link) {
      if (newSession) {
        link.textContent = "My Shipments";
        link.setAttribute("href", "dashboard.html");
      } else {
        link.textContent = "Sign In";
        link.setAttribute("href", "login.html");
      }
    });
  });
});
