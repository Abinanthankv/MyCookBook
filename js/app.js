/**
 * Cookbook Site - Main Application Logic
 */

// ========================================
// Recipe Data Loading
// ========================================

let allRecipes = [];
let activeIngredients = [];

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
     
      ${bookmarkBtn}
      ${deleteBtn}
    </div>
    <div class="recipe-card-content">
      <h3 class="recipe-card-title">${recipe.title}</h3>
      <p class="recipe-card-desc">${recipe.description}</p>
      
      <!-- Cook Count Badge (Dynamic) -->
      ${CookHistory.getCookCount(recipe.id) > 0 ? `
        <div class="card-cook-badge">
            <span>👨‍🍳 ${CookHistory.getCookCount(recipe.id)} made</span>
        </div>
      ` : ''}

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

    // Cleanup collections and history
    Collections.removeRecipeFromAll(id);
    CookHistory.deleteForRecipe(id);

    // Reload recipes
    loadRecipes().then(() => {
        renderRecipes(allRecipes);
        renderCollectionChips(); // Refresh the collection counts/chips
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

function filterRecipes(searchTerm, category, collectionId = null) {
    let filtered = allRecipes;

    // Filter by collection first if specified
    if (collectionId) {
        const collectionRecipeIds = Collections.getRecipesInCollection(collectionId);
        filtered = filtered.filter(r => collectionRecipeIds.includes(String(r.id)) || collectionRecipeIds.includes(Number(r.id)));
    } else if (category === 'bookmarks') {
        // Filter to show only bookmarked recipes
        const bookmarkedIds = Bookmarks.getAll();
        filtered = filtered.filter(r => bookmarkedIds.includes(r.id));
    } else if (category === 'recently-cooked') {
        // Filter to show only recently cooked recipes
        const recent = CookHistory.getRecentlyCooked(50);
        const recentIds = recent.map(h => h.recipeId);
        filtered = filtered.filter(r => recentIds.includes(String(r.id)) || recentIds.includes(Number(r.id)));
        // Sort by recency
        filtered.sort((a, b) => {
            const dateA = new Date(recent.find(h => h.recipeId == a.id)?.lastCooked || 0);
            const dateB = new Date(recent.find(h => h.recipeId == b.id)?.lastCooked || 0);
            return dateB - dateA;
        });
    } else if (category && category !== 'all') {
        filtered = filtered.filter(r => r.category === category);
    }

    // Filter by ingredients (must contain all active ingredients)
    if (activeIngredients.length > 0) {
        filtered = filtered.filter(recipe => {
            return activeIngredients.every(ing =>
                recipe.ingredients.some(ri => ri.toLowerCase().includes(ing.toLowerCase()))
            );
        });
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

let currentCategory = 'all';
let currentCollection = null;
let currentSearchTerm = '';

function filterAndRender() {
    const filtered = filterRecipes(currentSearchTerm, currentCategory, currentCollection);
    renderRecipes(filtered);
}

function initSearch() {
    const filters = document.getElementById('filters');
    const collectionFilters = document.getElementById('collectionFilters');
    const ingredientInput = document.getElementById('ingredientInput');

    if (!filters) return;

    // Unified search/ingredient input handler
    if (ingredientInput) {
        ingredientInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            filterAndRender();
        });
    }

    // Category filter handler
    filters.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (btn) {
            // Update active state
            filters.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
            if (collectionFilters) {
                collectionFilters.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
            }
            btn.classList.add('active');

            // Apply filter
            currentCategory = btn.dataset.category;
            currentCollection = null;
            filterAndRender();
        }
    });

    // Collection filter handler
    if (collectionFilters) {
        collectionFilters.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip');
            if (btn) {
                // Update active state
                filters.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
                collectionFilters.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply filter
                currentCollection = btn.dataset.collection;
                currentCategory = null;
                filterAndRender();
            }
        });

        // Initialize collections
        renderCollectionChips();
    }

    // Initial load
    filterAndRender();
    initIngredientFilters();
}

function initIngredientFilters() {
    const ingredientInput = document.getElementById('ingredientInput');
    const addBtn = document.getElementById('addIngredientBtn');

    if (!ingredientInput || !addBtn) return;

    function addIngredient() {
        const value = ingredientInput.value.trim();
        if (value && !activeIngredients.includes(value)) {
            activeIngredients.push(value);
            ingredientInput.value = '';
            currentSearchTerm = ''; // Clear text search when adding a tag
            renderIngredientTags();
            filterAndRender();
        }
    }

    ingredientInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addIngredient();
    });

    addBtn.addEventListener('click', addIngredient);
}

function renderIngredientTags() {
    const container = document.getElementById('activeIngredients');
    if (!container) return;

    if (activeIngredients.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = activeIngredients.map(ing => `
        <div class="ingredient-tag">
            <span>${ing}</span>
            <span class="remove-icon" onclick="removeIngredientTag('${ing}')">✕</span>
        </div>
    `).join('');
}

// Global scope for onclick
window.removeIngredientTag = function (ing) {
    activeIngredients = activeIngredients.filter(i => i !== ing);
    renderIngredientTags();
    filterAndRender();
};

// Show toast notification (replicated from recipe.js for homepage use)
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}

function renderCollectionChips() {
    const container = document.getElementById('collectionFilters');
    if (!container) return;

    const collections = Collections.getAll();
    const sorted = Object.entries(collections).sort((a, b) => a[1].name.localeCompare(b[1].name));

    container.innerHTML = sorted.map(([id, col]) => `
        <button class="chip" data-collection="${id}">${col.icon} ${col.name}</button>
    `).join('');
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
