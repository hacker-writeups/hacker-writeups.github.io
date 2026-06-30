/* ===================================================================
   Hacker Write-Ups — Main Application Script
   =================================================================== */

/* ===== STATE ===== */
let articles = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let filteredArticles = [];
let selectedTagsList = [];
let activeFilter = "All";

/* ===================================================================
   DATA LOADING
   =================================================================== */

/**
 * Fetch article data from articles.json and boot the app.
 */
async function loadArticles() {
  try {
    const res = await fetch("articles.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    articles = await res.json();
    filteredArticles = [...articles];
    initApp();
  } catch (err) {
    console.error("Failed to load articles.json:", err);
    showToast("⚠️ Could not load articles. Please refresh.", "error");
    // Render empty states so the UI is not broken
    renderHome();
    renderWriteUps();
  }
}

/**
 * Called once articles are loaded. Wires up everything and renders
 * the default (home) page.
 */
function initApp() {
  initTheme();
  renderHome();
  // Wire up the sponsor-modal overlay close-on-backdrop-click
  document
    .getElementById("sponsorModal")
    .addEventListener("click", function (e) {
      if (e.target === this) closeSponsorModal();
    });
}

/* ===================================================================
   PAGE NAVIGATION
   =================================================================== */

/**
 * Show the named page and hide all others.
 * @param {string} name  - One of: home | writeups | submit | sponsors | about
 */
function showPage(name) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");

  // Update nav active state
  document.querySelectorAll(".nav-link").forEach((l) => {
    l.classList.toggle("active", l.dataset.page === name);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "home") renderHome();
  if (name === "writeups") renderWriteUps();

  return false; // prevent anchor navigation
}

/* ===================================================================
   THEME
   =================================================================== */

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";

  html.setAttribute("data-theme", next);
  document.getElementById("themeBtn").textContent = isDark ? "🌙" : "☀️";
  localStorage.setItem("hwu-theme", next);
}

function initTheme() {
  const saved = localStorage.getItem("hwu-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  document.getElementById("themeBtn").textContent =
    saved === "dark" ? "☀️" : "🌙";
}

/* ===================================================================
   MOBILE MENU
   =================================================================== */

function toggleMobile() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

/* ===================================================================
   HOME PAGE RENDERING
   =================================================================== */

function renderHome() {
  renderFeatured();
  renderLatestGrid();
  renderStatTotal();
  renderCategoriesGrid();
}

function renderFeatured() {
  const featured = articles.find((a) => a.featured);
  const featuredEl = document.getElementById("homeFeatured");
  if (!featuredEl) return;

  if (!featured) {
    featuredEl.innerHTML = "";
    return;
  }

  featuredEl.innerHTML = `
    <div class="featured-card" onclick="openArticle('${escHtml(featured.url)}')">
      <span class="featured-badge">⭐ Featured</span>
      <div class="featured-icon">${featured.icon}</div>
      <div class="featured-body">
        <div class="card-tags">${tagsHTML(featured.tags)}</div>
        <div class="card-title" style="margin-top:0.5rem;">${escHtml(featured.title)}</div>
        <div class="card-desc">${escHtml(featured.description)}</div>
        <div class="card-footer" style="border:none;padding-top:0.5rem;">
          <div class="card-author">
            <div class="author-avatar">${featured.author[0].toUpperCase()}</div>
            <div class="author-info">
              <span class="author-name">${escHtml(featured.author)}</span>
              <span class="card-date">${formatDate(featured.date)} · ${escHtml(featured.source)}</span>
            </div>
          </div>
          <a class="read-link" href="${escHtml(featured.url)}" target="_blank" rel="noopener noreferrer"
             onclick="event.stopPropagation()">Read →</a>
        </div>
      </div>
    </div>`;
}

function renderLatestGrid() {
  const grid = document.getElementById("homeGrid");
  if (!grid) return;

  const latest = [...articles]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  grid.innerHTML = latest.map((a) => cardHTML(a)).join("");
}

function renderStatTotal() {
  const el = document.getElementById("statTotal");
  if (el) el.textContent = articles.length;
}

function renderCategoriesGrid() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  const cats = [
    "Bug Bounty",
    "RCE",
    "XSS",
    "SQLi",
    "HackerOne",
    "BugCrowd",
    // "OSINT",
    // "Malware",
    "Misc",
  ];
  const icons = {
    "Bug Bounty": "🌐",
    RCE: "💀",
    SQLi: "🔐",
    XSS: "🧠",
    HackerOne: "🌐",
    BugCrowd: "🌐",
    // Reverse: "🔄",
    // OSINT: "🔎",
    // Malware: "🦠",
    Misc: "📦",
  };

  grid.innerHTML = cats
    .map((c) => {
      const count = articles.filter((a) => a.tags.includes(c)).length;
      return `
      <div class="cat-card"
           onclick="filterByTag('${c}')"
           onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-3px)'"
           onmouseout="this.style.borderColor='var(--border)';this.style.transform=''"
           style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
                  padding:1.25rem;display:flex;flex-direction:column;align-items:center;
                  gap:0.5rem;cursor:pointer;transition:border-color 0.2s,transform 0.2s;">
        <span style="font-size:1.8rem;">${icons[c]}</span>
        <span style="font-weight:700;font-size:0.92rem;">${c}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">${count} write-up${count !== 1 ? "s" : ""}</span>
      </div>`;
    })
    .join("");
}

/* ===================================================================
   WRITE-UPS PAGE RENDERING
   =================================================================== */

function renderWriteUps() {
  buildFiltersBar();
  filterArticles();
}

function buildFiltersBar() {
  const allTags = ["All", ...new Set(articles.flatMap((a) => a.tags))];
  const bar = document.getElementById("filtersBar");
  if (!bar) return;

  bar.innerHTML = allTags
    .map(
      (t) =>
        `<button class="filter-tag${t === activeFilter ? " active" : ""}"
             onclick="setFilter('${escHtml(t)}')">${t}</button>`,
    )
    .join("");
}

function setFilter(tag) {
  activeFilter = tag;
  currentPage = 1;
  buildFiltersBar();
  filterArticles();
}

function filterArticles() {
  const searchEl = document.getElementById("searchInput");
  const sortEl = document.getElementById("sortSelect");
  const q = searchEl ? searchEl.value.toLowerCase().trim() : "";
  const sort = sortEl ? sortEl.value : "newest";

  filteredArticles = articles.filter((a) => {
    const matchTag = activeFilter === "All" || a.tags.includes(activeFilter);
    const matchQ =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q));
    return matchTag && matchQ;
  });

  // Sort
  if (sort === "newest")
    filteredArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sort === "oldest")
    filteredArticles.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sort === "az")
    filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === "za")
    filteredArticles.sort((a, b) => b.title.localeCompare(a.title));

  // Results count
  const countEl = document.getElementById("resultsCount");
  if (countEl) {
    countEl.textContent = `${filteredArticles.length} result${filteredArticles.length !== 1 ? "s" : ""}`;
  }

  // Paginate
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredArticles.slice(start, start + ITEMS_PER_PAGE);

  const grid = document.getElementById("articlesGrid");
  const empty = document.getElementById("emptyState");

  if (paginated.length === 0) {
    if (grid) grid.innerHTML = "";
    if (empty) empty.style.display = "block";
  } else {
    if (grid) grid.innerHTML = paginated.map((a) => cardHTML(a)).join("");
    if (empty) empty.style.display = "none";
  }

  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const pg = document.getElementById("pagination");
  if (!pg) return;

  if (total <= 1) {
    pg.innerHTML = "";
    return;
  }

  let html = "";
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">‹</button>`;
  }
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn${i === currentPage ? " active" : ""}" onclick="goPage(${i})">${i}</button>`;
  }
  if (currentPage < total) {
    html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">›</button>`;
  }
  pg.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  filterArticles();
  const writeupPage = document.getElementById("page-writeups");
  if (writeupPage) writeupPage.scrollIntoView({ behavior: "smooth" });
}

/* ===================================================================
   CARD HTML HELPERS
   =================================================================== */

function cardHTML(a) {
  return `
    <div class="article-card" onclick="openArticle('${escHtml(a.url)}')">
      <div class="card-tags">${tagsHTML(a.tags)}</div>
      <div class="card-title">${escHtml(a.title)}</div>
      <div class="card-desc">${escHtml(a.description)}</div>
      <div class="card-footer">
        <div class="card-author">
          <div class="author-avatar">${a.author[0].toUpperCase()}</div>
          <div class="author-info">
            <span class="author-name">${escHtml(a.author)}</span>
            <span class="card-date">${formatDate(a.date)}</span>
          </div>
        </div>
        <a class="read-link" href="${escHtml(a.url)}" target="_blank" rel="noopener noreferrer"
           onclick="event.stopPropagation()">Read →</a>
      </div>
    </div>`;
}

function tagsHTML(tags) {
  return tags
    .map((t) => `<span class="tag ${t.toLowerCase()}">${escHtml(t)}</span>`)
    .join("");
}

function openArticle(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Navigate to Write-Ups page with a pre-set tag filter.
 * Called from footer category links and the categories grid.
 */
function filterByTag(tag) {
  activeFilter = tag;
  currentPage = 1;
  showPage("writeups");
}

/* ===================================================================
   SUBMIT FORM
   =================================================================== */

function toggleTag(btn, tag) {
  btn.classList.toggle("selected");
  if (selectedTagsList.includes(tag)) {
    selectedTagsList = selectedTagsList.filter((t) => t !== tag);
  } else {
    selectedTagsList.push(tag);
  }
}

function handleSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("f-title").value.trim();
  const name = document.getElementById("f-name").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const url = document.getElementById("f-url").value.trim();
  const desc = document.getElementById("f-desc").value.trim();
  const agree = document.getElementById("f-agree").checked;

  // Validation
  if (!title || !name || !email || !url || !desc) {
    showToast("⚠️ Please fill in all required fields.", "error");
    return;
  }
  if (!isValidEmail(email)) {
    showToast("⚠️ Please enter a valid email address.", "error");
    return;
  }
  if (!isValidUrl(url)) {
    showToast("⚠️ Please enter a valid URL starting with https://", "error");
    return;
  }
  if (selectedTagsList.length === 0) {
    showToast("⚠️ Please select at least one category tag.", "error");
    return;
  }
  if (!agree) {
    showToast("⚠️ Please agree to the submission guidelines.", "error");
    return;
  }

  // Success
  document.getElementById("submitForm").style.display = "none";
  document.getElementById("successMsg").classList.add("show");
  showToast("✅ Write-up submitted successfully!", "success");
}

/* ===================================================================
   SPONSOR MODAL
   =================================================================== */

function openSponsorModal(plan, price) {
  document.getElementById("modalTitle").textContent =
    `${plan} Sponsorship — ${price}`;
  document.getElementById("modalSub").textContent =
    `You selected the ${plan} plan (${price}). Fill in your details and we'll respond within 24 hours.`;
  document.getElementById("s-plan").value = `${plan} — ${price}`;
  document.getElementById("sponsorForm").style.display = "";
  document.getElementById("sponsorSuccess").classList.remove("show");
  document.getElementById("sponsorModal").classList.add("open");
}

function closeSponsorModal() {
  document.getElementById("sponsorModal").classList.remove("open");
}

function handleSponsorSubmit(e) {
  e.preventDefault();

  const company = document.getElementById("s-company").value.trim();
  const name = document.getElementById("s-name").value.trim();
  const email = document.getElementById("s-email").value.trim();
  const msg = document.getElementById("s-message").value.trim();

  if (!company || !name || !email || !msg) {
    showToast("⚠️ Please fill in all required fields.", "error");
    return;
  }
  if (!isValidEmail(email)) {
    showToast("⚠️ Please enter a valid email address.", "error");
    return;
  }

  document.getElementById("sponsorForm").style.display = "none";
  document.getElementById("sponsorSuccess").classList.add("show");
  showToast("✅ Sponsorship request sent!", "success");
}

/* ===================================================================
   FAQ ACCORDION
   =================================================================== */

function toggleFaq(el) {
  el.parentElement.classList.toggle("open");
}

/* ===================================================================
   TOAST NOTIFICATION
   =================================================================== */

let toastTimer = null;

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;

  t.textContent = msg;
  t.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3500);
}

/* ===================================================================
   UTILITY HELPERS
   =================================================================== */

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidUrl(u) {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

/** Escape HTML special characters to prevent XSS in innerHTML templates. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ===================================================================
   BOOT
   =================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Initialise theme immediately (before fetch) so there's no flash
  const saved = localStorage.getItem("hwu-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  const themeBtn = document.getElementById("themeBtn");
  if (themeBtn) themeBtn.textContent = saved === "dark" ? "☀️" : "🌙";

  // Load data and boot
  loadArticles();
});
