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

    // Delete button for custom recipes
    const deleteBtn = recipe.isCustom ? `
        <button class="recipe-delete-btn" data-id="${recipe.id}" title="Delete recipe">🗑️</button>
    ` : '';

    card.innerHTML = `
    <div class="recipe-card-image">
      <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
      <span class="recipe-card-category">${recipe.category}</span>
      ${recipe.isCustom ? '<span class="recipe-card-custom">Custom</span>' : ''}
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
    if (category && category !== 'all') {
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

    // Category filter handler
    filters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Update active state
            filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
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
