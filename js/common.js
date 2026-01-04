/**
 * Cookbook Site - Common Shared Logic
 */

// Theme Management
const ThemeManager = {
    STORAGE_KEY: 'cookbook-theme',
    OVERRIDES_KEY: 'cookbook-theme-overrides',

    init() {
        this.apply();
    },

    apply(themeId = null) {
        const theme = themeId || localStorage.getItem(this.STORAGE_KEY) || 'zesty-garden';

        // Save if explicitly provided
        if (themeId) localStorage.setItem(this.STORAGE_KEY, theme);

        document.documentElement.setAttribute('data-theme', theme);

        // Apply custom overrides
        const overrides = JSON.parse(localStorage.getItem(this.OVERRIDES_KEY) || '{}');
        const themeOverrides = overrides[theme] || {};

        // Clear old inline styles first to ensure clean switch
        document.documentElement.removeAttribute('style');

        Object.keys(themeOverrides).forEach(prop => {
            document.documentElement.style.setProperty(prop, themeOverrides[prop]);
            // Handle primary-soft variant
            if (prop === '--color-primary') {
                document.documentElement.style.setProperty('--color-primary-soft', `${themeOverrides[prop]}1a`);
            }
        });
    }
};

// Initialize on load
ThemeManager.init();
window.ThemeManager = ThemeManager;

// Helper to show toast messages across any page
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========================================
// Custom Recipes Storage Manager
// ========================================
const CustomRecipes = {
    STORAGE_KEY: 'cookbook-custom-recipes',

    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    save(recipe) {
        let recipes = this.getAll();

        // Check if ID already exists
        const existingIndex = recipe.id ? recipes.findIndex(r => r.id === recipe.id) : -1;

        if (existingIndex !== -1) {
            // Update existing
            recipes[existingIndex] = { ...recipe, isCustom: true };
        } else {
            // Create new
            if (!recipe.id) {
                // Generate unique ID with timestamp + random suffix for new recipes
                recipe.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            }
            recipe.isCustom = true;
            recipes.push(recipe);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
        return recipe;
    },

    update(updatedRecipe) {
        let recipes = this.getAll();
        const index = recipes.findIndex(r => r.id === updatedRecipe.id);
        if (index !== -1) {
            recipes[index] = { ...updatedRecipe, isCustom: true };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
            return true;
        }
        return false;
    },

    delete(id) {
        let recipes = this.getAll();
        recipes = recipes.filter(r => r.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    },

    getById(id) {
        const recipes = this.getAll();
        // Loose equality to handle numeric IDs from recipes.json being compared to string IDs
        return recipes.find(r => r.id == id || String(r.id) === String(id));
    }
};
