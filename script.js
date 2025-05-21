const xhr = new XMLHttpRequest();
xhr.open("GET", "resources.json", true);
xhr.onload = function () {
  if (xhr.status === 200) {
    resources = JSON.parse(xhr.responseText);
    // initializeApplication();
  }
};
xhr.send();
// Global variables
let resources = []; // This will store our loaded resources
let filteredResources = [];
let currentPage = 1;
const resourcesPerPage = 9;
// DOM elements
const resourceGrid = document.getElementById("resourceGrid");
const tagContainer = document.getElementById("tagContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const paginationContainer = document.createElement("div");
paginationContainer.className = "pagination";
resourceGrid.parentNode.insertBefore(
  paginationContainer,
  resourceGrid.nextSibling
);
// Load resources from JSON file
async function loadResources() {
  resourceGrid.innerHTML = '<p class="loading">Loading resources...</p>';
  try {
    const response = await fetch("resources.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    resources = await response.json();
    if (!Array.isArray(resources)) {
      throw new Error("Invalid data format: expected array");
    }
    filteredResources = [...resources];
    initializeApplication();
  } catch (error) {
    console.error("Error loading resources:", error);
    resourceGrid.innerHTML = `
            <p class="error">
                Failed to load resources. <br/><br/>
                <button onclick="location.reload()" style="padding:.5rem 2rem;">Retry</button>
            </p>
        `;
  }
}
// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  displayResources(resources);
  //   setupTags();
  setupEventListeners();
  // Check for dark mode preference
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  }
});
// Display resources in the grid
function displayResources(resourcesToDisplay, page = 1) {
  resourceGrid.innerHTML = "";
  resourcesToDisplay.forEach((resource) => {
    const card = document.createElement("div");
    card.className = "resource-card";
    card.innerHTML = `
            // <img src="${resource.image}" alt="${resource.title}">
            <div class="resource-content">
                <h3><a href="${resource.url}" target="_blank">${
      resource.title
    }</a></h3>
                <p>${resource.description}</p>
                <div class="resource-meta">
                    <span>${resource.author}</span>
                    <span>${formatDate(resource.date)}</span>
                </div>
                <div class="resource-tags">
                    ${resource.tags
                      .map(
                        (tag) =>
                          `<span class="tag" data-tag="${tag}">${tag}</span>`
                      )
                      .join("")}
                </div>
            </div>
        `;

    resourceGrid.appendChild(card);
  });
  currentPage = page;
  filteredResources = resourcesToDisplay;

  // Calculate pagination
  const totalPages = Math.ceil(resourcesToDisplay.length / resourcesPerPage);
  const startIndex = (page - 1) * resourcesPerPage;
  const endIndex = startIndex + resourcesPerPage;
  const paginatedResources = resourcesToDisplay.slice(startIndex, endIndex);

  // Clear and display current page resources
  resourceGrid.innerHTML = "";
  paginatedResources.forEach((resource) => {
    const card = document.createElement("div");
    card.className = "resource-card";
    card.innerHTML = `
            <div class="resource-content">
                <h3><a href="${
                  resource.url
                }" target="_blank" style="text-decoration: none;">${
      resource.title
    }</a></h3>
                <p>${resource.description}</p>
                <div class="resource-meta">
                    <span>Author - ${resource.author}</span>
                    <span>${formatDate(resource.date)}</span>
                </div>
                <div class="resource-tags">
                    ${resource.tags
                      .map(
                        (tag) =>
                          `<span class="tag" data-tag="${tag}">${tag}</span>`
                      )
                      .join("")}
                </div>
            </div>
        `;
    resourceGrid.appendChild(card);
  });
  // Update pagination controls
  updatePaginationControls(resourcesToDisplay.length, page);
}
// Set up all unique tags
function setupTags() {
  // Get all unique tags
  const allTags = new Set();
  resources.forEach((resource) => {
    resource.tags.forEach((tag) => allTags.add(tag));
  });
  // Add "All" tag
  const allTag = document.createElement("span");
  allTag.className = "tag active";
  allTag.textContent = "All";
  allTag.dataset.tag = "all";
  tagContainer.appendChild(allTag);
  // Add other tags
  Array.from(allTags)
    .sort()
    .forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;
      tagElement.dataset.tag = tag;
      tagContainer.appendChild(tagElement);
    });
}
// Set up event listeners
function setupEventListeners() {
  // Tag filtering
  tagContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("tag")) {
      const selectedTag = e.target.dataset.tag;

      document.querySelectorAll("#tagContainer .tag").forEach((tag) => {
        tag.classList.remove("active");
      });
      e.target.classList.add("active");

      if (selectedTag === "all") {
        displayResources(resources, 1);
      } else {
        const filteredResources = resources.filter((resource) =>
          resource.tags.includes(selectedTag)
        );
        displayResources(filteredResources, 1);
      }
    }
  });
  // Search functionality
  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
  // Dark mode toggle
  darkModeToggle.addEventListener("click", toggleDarkMode);
  // Tag clicks on resource cards
  resourceGrid.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("tag") &&
      e.target.parentElement.classList.contains("resource-tags")
    ) {
      const tag = e.target.dataset.tag;
      const tagElement = document.querySelector(
        `#tagContainer .tag[data-tag="${tag}"]`
      );
      if (tagElement) {
        // Update active tag
        document.querySelectorAll("#tagContainer .tag").forEach((t) => {
          t.classList.remove("active");
        });
        tagElement.classList.add("active");
        // Filter resources
        const filteredResources = resources.filter((resource) =>
          resource.tags.includes(tag)
        );
        displayResources(filteredResources);
      }
    }
  });
}
// Perform search
function performSearch() {
  const searchTerm = searchInput.value.toLowerCase();

  if (searchTerm.trim() === "") {
    displayResources(resources);
    return;
  }
  const searchedResources = resources.filter(
    (resource) =>
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
      resource.author.toLowerCase().includes(searchTerm)
  );
  displayResources(searchedResources, 1); // Always reset to page 1 after search
}
// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
  }
}
// Helper function to format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}
function updatePaginationControls(totalResources, currentPage) {
  const totalPages = Math.ceil(totalResources / resourcesPerPage);
  paginationContainer.innerHTML = "";
  if (totalPages <= 1) return;
  // Previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "&laquo; Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      displayResources(filteredResources, currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(prevButton);
  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  if (startPage > 1) {
    const firstPageButton = document.createElement("button");
    firstPageButton.textContent = "1";
    firstPageButton.addEventListener("click", () => {
      displayResources(filteredResources, 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginationContainer.appendChild(firstPageButton);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => {
      displayResources(filteredResources, i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginationContainer.appendChild(pageButton);
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
    const lastPageButton = document.createElement("button");
    lastPageButton.textContent = totalPages;
    lastPageButton.addEventListener("click", () => {
      displayResources(filteredResources, totalPages);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    paginationContainer.appendChild(lastPageButton);
  }
  // Next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "Next &raquo;";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      displayResources(filteredResources, currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  paginationContainer.appendChild(nextButton);
}
document.addEventListener("DOMContentLoaded", () => {
  displayResources(resources, 1); // Start on page 1
  //   setupTags();
  setupEventListeners();

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  }
});
function initializeApplication() {
  displayResources(resources, 1);
  setupTags();
  setupEventListeners();
  setupMobileMenu(); // Add this line

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
  }
}
// Mobile menu toggle functionality
function setupMobileMenu() {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  // Only setup toggle behavior if we're on mobile
  function checkMobileMenu() {
    if (window.innerWidth <= 768) {
      // Mobile behavior
      mobileMenuToggle.addEventListener("click", toggleMenu);
      // Close menu when clicking outside
      document.addEventListener("click", closeMenuOnClickOutside);
    } else {
      // Desktop behavior - ensure menu is always visible
      navLinks.classList.add("active");
      navLinks.style.display = "flex";
      // Remove mobile event listeners
      mobileMenuToggle.removeEventListener("click", toggleMenu);
      document.removeEventListener("click", closeMenuOnClickOutside);
    }
  }
  function toggleMenu() {
    navLinks.classList.toggle("active");
    const icon = mobileMenuToggle.querySelector("i");
    if (navLinks.classList.contains("active")) {
      icon.classList.replace("fa-bars", "fa-times");
    } else {
      icon.classList.replace("fa-times", "fa-bars");
    }
  }
  function closeMenuOnClickOutside(e) {
    if (!e.target.closest("nav") && window.innerWidth <= 768) {
      navLinks.classList.remove("active");
      mobileMenuToggle
        .querySelector("i")
        .classList.replace("fa-times", "fa-bars");
    }
  }
  // Check on initial load
  checkMobileMenu();
  // Check when window is resized
  window.addEventListener("resize", checkMobileMenu);
}
// Start the application
document.addEventListener("DOMContentLoaded", loadResources);
