/**
 * Cookbook Site - Main Application Logic
 */

// ========================================
// Theme Toggle
// ========================================

const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme === 'dark');
} else {
    setTheme(prefersDark.matches);
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
});

// ========================================
// Recipe Data Loading
// ========================================

let allRecipes = [];

// ========================================
// Bookmarks Storage
// ========================================

const Bookmarks = {
    STORAGE_KEY: 'cookbook-bookmarks',

    getAll() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    },

    isBookmarked(id) {
        return this.getAll().includes(id);
    },

    toggle(id) {
        let bookmarks = this.getAll();
        if (bookmarks.includes(id)) {
            bookmarks = bookmarks.filter(b => b !== id);
        } else {
            bookmarks.push(id);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
        return bookmarks.includes(id);
    },

    add(id) {
        const bookmarks = this.getAll();
        if (!bookmarks.includes(id)) {
            bookmarks.push(id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
        }
    },

    remove(id) {
        let bookmarks = this.getAll();
        bookmarks = bookmarks.filter(b => b !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
    }
};

async function loadRecipes() {
    try {
        const response = await fetch('data/recipes.json');
        const data = await response.json();
        let recipes = data.recipes || [];

        // Merge with custom recipes from localStorage
        const customRecipes = JSON.parse(localStorage.getItem('cookbook-custom-recipes') || '[]');
        allRecipes = [...recipes, ...customRecipes];

        return allRecipes;
    } catch (error) {
        console.error('Error loading recipes:', error);
        // Still try to load custom recipes even if default recipes fail
        allRecipes = JSON.parse(localStorage.getItem('cookbook-custom-recipes') || '[]');
        return allRecipes;
    }
}

// ========================================
// Recipe Card Rendering
// ========================================

function createRecipeCard(recipe) {
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.setAttribute('data-recipe-id', recipe.id);

    const isBookmarked = Bookmarks.isBookmarked(recipe.id);

    // Delete button for custom recipes - uses SVG icon
    const deleteIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    const deleteBtn = recipe.isCustom ? `
        <button class="recipe-delete-btn" data-id="${recipe.id}" title="Delete recipe">${deleteIcon}</button>
    ` : '';

    // Bookmark button - uses SVG icons
    const bookmarkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
    const bookmarkBtn = `
        <button class="recipe-bookmark-btn ${isBookmarked ? 'active' : ''}" data-id="${recipe.id}" title="Bookmark">
            ${bookmarkIcon}
        </button>
    `;

    card.innerHTML = `
    <div class="recipe-card-image">
      <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
      <span class="recipe-card-category">${recipe.category}</span>
      ${recipe.isCustom ? '<span class="recipe-card-custom">Custom</span>' : ''}
      ${bookmarkBtn}
      ${deleteBtn}
    </div>
    <div class="recipe-card-content">
      <h3 class="recipe-card-title">${recipe.title}</h3>
      <p class="recipe-card-desc">${recipe.description}</p>
      <div class="recipe-card-meta">
        <span>⏱️ ${recipe.totalTime}</span>
        <span>👤 ${recipe.servings} servings</span>
        <span>📊 ${recipe.difficulty}</span>
      </div>
    </div>
  `;

    // Bookmark button click handler
    const bookmarkBtnEl = card.querySelector('.recipe-bookmark-btn');
    if (bookmarkBtnEl) {
        bookmarkBtnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const nowBookmarked = Bookmarks.toggle(recipe.id);
            bookmarkBtnEl.classList.toggle('active', nowBookmarked);
        });
    }

    // Delete button click handler
    const deleteBtnEl = card.querySelector('.recipe-delete-btn');
    if (deleteBtnEl) {
        deleteBtnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${recipe.title}"?`)) {
                deleteCustomRecipe(recipe.id);
            }
        });
    }

    card.addEventListener('click', () => {
        window.location.href = `recipe.html?id=${recipe.id}`;
    });

    return card;
}

// Delete custom recipe
function deleteCustomRecipe(id) {
    const STORAGE_KEY = 'cookbook-custom-recipes';
    let recipes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    recipes = recipes.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));

    // Reload recipes
    loadRecipes().then(() => {
        renderRecipes(allRecipes);
    });
}

function renderRecipes(recipes) {
    const grid = document.getElementById('recipeGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    grid.innerHTML = '';

    if (recipes.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        recipes.forEach(recipe => {
            grid.appendChild(createRecipeCard(recipe));
        });
    }
}

// ========================================
// Search & Filter
// ========================================

function filterRecipes(searchTerm, category) {
    let filtered = allRecipes;

    // Filter by category
    if (category === 'bookmarks') {
        // Filter to show only bookmarked recipes
        const bookmarkedIds = Bookmarks.getAll();
        filtered = filtered.filter(r => bookmarkedIds.includes(r.id));
    } else if (category && category !== 'all') {
        filtered = filtered.filter(r => r.category === category);
    }

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(r =>
            r.title.toLowerCase().includes(term) ||
            r.description.toLowerCase().includes(term) ||
            r.ingredients.some(i => i.toLowerCase().includes(term))
        );
    }

    return filtered;
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const filters = document.getElementById('filters');

    if (!searchInput || !filters) return;

    let currentCategory = 'all';

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const filtered = filterRecipes(e.target.value, currentCategory);
        renderRecipes(filtered);
    });

    // Category filter handler (supports both .filter-btn and .chip)
    filters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn') || e.target.classList.contains('chip')) {
            // Update active state
            filters.querySelectorAll('.filter-btn, .chip').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Apply filter
            currentCategory = e.target.dataset.category;
            const filtered = filterRecipes(searchInput.value, currentCategory);
            renderRecipes(filtered);
        }
    });
}

// ========================================
// Utility Functions
// ========================================

function getRecipeById(id) {
    // Use loose equality to handle string/number comparison
    return allRecipes.find(r => r.id == id || String(r.id) === String(id));
}

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// ========================================
// Initialize Homepage
// ========================================

async function initHomepage() {
    const recipeGrid = document.getElementById('recipeGrid');
    if (!recipeGrid) return;

    await loadRecipes();
    renderRecipes(allRecipes);
    initSearch();
}

// Run on page load
if (document.getElementById('recipeGrid')) {
    initHomepage();
}

// ========================================
// PWA Service Worker Registration
// ========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}
