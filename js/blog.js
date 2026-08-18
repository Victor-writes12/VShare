/* ==========================================================================
   VSHARE T&T — blog.js
   Handles both blog.html (listing) and blog-post.html (single article).
   Detects which page it is by which elements exist on the page.
   ========================================================================== */

function vshareFormatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

document.addEventListener("DOMContentLoaded", async function () {
  if (!window.vshareSupabase) return;

  /* ---- Blog listing page ---- */
  const listEl = document.querySelector("[data-blog-list]");
  if (listEl) {
    const emptyEl = document.querySelector("[data-blog-empty]");

    const { data, error } = await window.vshareSupabase
      .from("posts")
      .select("slug, title, excerpt, cover_image_url, author_name, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(function (post) {
      const card = document.createElement("article");
      card.className = "blog-card reveal";

      const mediaHtml = post.cover_image_url
        ? '<div class="blog-card__media"><img src="' + post.cover_image_url + '" alt="' + post.title.replace(/"/g, "&quot;") + '"></div>'
        : "";

      card.innerHTML =
        mediaHtml +
        '<div class="blog-card__body">' +
          '<span class="blog-card__date">' + vshareFormatDate(post.published_at) + "</span>" +
          "<h3>" + post.title + "</h3>" +
          "<p>" + (post.excerpt || "") + "</p>" +
          '<a href="blog-post.html?slug=' + encodeURIComponent(post.slug) + '" class="blog-card__link">Read More <i class="fa-solid fa-arrow-right"></i></a>' +
        "</div>";

      fragment.appendChild(card);
    });

    listEl.appendChild(fragment);

    // Re-run scroll reveal for the cards we just added, since they were
    // not present when animations.js first scanned the page.
    if (window.IntersectionObserver) {
      document.querySelectorAll(".blog-card.reveal").forEach(function (el) {
        setTimeout(function () { el.classList.add("is-visible"); }, 50);
      });
    }
  }

  /* ---- Single post page ---- */
  const postBody = document.querySelector("[data-post-body]");
  if (postBody) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const loadingEl = document.querySelector("[data-post-loading]");
    const notFoundEl = document.querySelector("[data-post-not-found]");

    if (!slug) {
      if (loadingEl) loadingEl.style.display = "none";
      if (notFoundEl) notFoundEl.style.display = "block";
      return;
    }

    const { data, error } = await window.vshareSupabase
      .from("posts")
      .select("title, excerpt, cover_image_url, content_html, author_name, published_at")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (loadingEl) loadingEl.style.display = "none";

    if (error || !data) {
      if (notFoundEl) notFoundEl.style.display = "block";
      return;
    }

    document.querySelector("[data-post-heading]").textContent = data.title;
    document.querySelector("[data-post-author]").textContent = data.author_name || "VSHARE T&T Team";
    document.querySelector("[data-post-date]").textContent = vshareFormatDate(data.published_at);
    document.querySelector("[data-post-content]").innerHTML = data.content_html;

    const titleTag = document.querySelector("[data-post-title]");
    if (titleTag) titleTag.textContent = data.title + " | VSHARE T&T";

    const descTag = document.querySelector("[data-post-description]");
    if (descTag && data.excerpt) descTag.setAttribute("content", data.excerpt);

    if (data.cover_image_url) {
      document.querySelector("[data-post-cover]").src = data.cover_image_url;
      document.querySelector("[data-post-cover]").alt = data.title;
      document.querySelector("[data-post-cover-wrap]").style.display = "block";
    }

    postBody.style.display = "block";
  }
});
