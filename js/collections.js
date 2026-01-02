// ========================================
// Recipe Collections Manager
// ========================================

const Collections = {
    STORAGE_KEY: 'cookbook-collections',

    // Default collections
    defaults: {
        'quick-meals': { name: 'Quick Meals', icon: '⚡', recipes: [] },
        'party-food': { name: 'Party Food', icon: '🎉', recipes: [] },
        'healthy': { name: 'Healthy', icon: '🥗', recipes: [] },
        'weeknight': { name: 'Weeknight Dinners', icon: '🌙', recipes: [] },
        'comfort-food': { name: 'Comfort Food', icon: '🍲', recipes: [] }
    },

    // Get all collections
    getAll() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) {
            // Initialize with defaults
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaults));
            return { ...this.defaults };
        }
        return JSON.parse(stored);
    },

    // Get a single collection by ID
    get(id) {
        const collections = this.getAll();
        return collections[id] || null;
    },

    // Create a new collection
    create(name, icon = '📁') {
        const collections = this.getAll();
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        if (collections[id]) {
            return { success: false, error: 'Collection already exists' };
        }

        collections[id] = { name, icon, recipes: [] };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        return { success: true, id };
    },

    // Delete a collection
    delete(id) {
        const collections = this.getAll();
        if (!collections[id]) {
            return { success: false, error: 'Collection not found' };
        }
        delete collections[id];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        return { success: true };
    },

    // Rename a collection
    rename(id, newName, newIcon) {
        const collections = this.getAll();
        if (!collections[id]) {
            return { success: false, error: 'Collection not found' };
        }
        collections[id].name = newName;
        if (newIcon) collections[id].icon = newIcon;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        return { success: true };
    },

    // Add recipe to collection
    addRecipe(collectionId, recipeId) {
        const collections = this.getAll();
        if (!collections[collectionId]) {
            return { success: false, error: 'Collection not found' };
        }

        if (!collections[collectionId].recipes.includes(recipeId)) {
            collections[collectionId].recipes.push(recipeId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        }
        return { success: true };
    },

    // Remove recipe from collection
    removeRecipe(collectionId, recipeId) {
        const collections = this.getAll();
        if (!collections[collectionId]) {
            return { success: false, error: 'Collection not found' };
        }

        collections[collectionId].recipes = collections[collectionId].recipes.filter(id => id !== recipeId);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        return { success: true };
    },

    // Check if recipe is in a collection
    isInCollection(collectionId, recipeId) {
        const collection = this.get(collectionId);
        return collection ? collection.recipes.includes(recipeId) : false;
    },

    // Get all collections containing a recipe
    getCollectionsForRecipe(recipeId) {
        const collections = this.getAll();
        const result = [];
        for (const [id, collection] of Object.entries(collections)) {
            if (collection.recipes.includes(recipeId)) {
                result.push({ id, ...collection });
            }
        }
        return result;
    },

    // Get all recipes in a collection
    getRecipesInCollection(collectionId) {
        const collection = this.get(collectionId);
        return collection ? collection.recipes : [];
    },

    // Remove recipe from all collections (Cleanup)
    removeRecipeFromAll(recipeId) {
        const collections = this.getAll();
        let changed = false;

        for (const id in collections) {
            const initialCount = collections[id].recipes.length;
            collections[id].recipes = collections[id].recipes.filter(rId =>
                String(rId) !== String(recipeId)
            );
            if (collections[id].recipes.length !== initialCount) {
                changed = true;
            }
        }

        if (changed) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(collections));
        }
        return changed;
    }
};

// ========================================
// Cook History Manager
// ========================================

const CookHistory = {
    STORAGE_KEY: 'cookbook-cook-history',

    // Get all history
    getAll() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        let history = stored ? JSON.parse(stored) : {};

        // Migration logic: convert old format to new format
        let upgraded = false;
        for (const recipeId in history) {
            const data = history[recipeId];
            if (data.dates && !data.entries) {
                data.entries = data.dates.map(date => ({
                    id: Math.random().toString(36).substr(2, 9),
                    date: date,
                    meal: 'unknown'
                }));
                // Delete old dates array to complete migration
                delete data.dates;
                upgraded = true;
            }
        }

        if (upgraded) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        }

        return history;
    },

    // Get history for a specific recipe
    get(recipeId) {
        const history = this.getAll();
        return history[recipeId] || null;
    },

    // Add a new cook entry
    addEntry(recipeId, date, meal) {
        const history = this.getAll();
        if (!history[recipeId]) {
            history[recipeId] = {
                count: 0,
                lastCooked: null,
                entries: []
            };
        }

        const entry = {
            id: Math.random().toString(36).substr(2, 9),
            date: date || new Date().toISOString().split('T')[0],
            meal: meal || 'unknown'
        };

        history[recipeId].entries.push(entry);
        history[recipeId].count = history[recipeId].entries.length;

        // Sort entries by date descending to find last cooked
        history[recipeId].entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        history[recipeId].lastCooked = history[recipeId].entries[0].date;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        return history[recipeId];
    },

    // Update an existing entry
    updateEntry(recipeId, entryId, newData) {
        const history = this.getAll();
        const recipeHistory = history[recipeId];
        if (!recipeHistory) return null;

        const index = recipeHistory.entries.findIndex(e => e.id === entryId);
        if (index === -1) return null;

        recipeHistory.entries[index] = { ...recipeHistory.entries[index], ...newData };

        // Re-sort and update lastCooked
        recipeHistory.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        recipeHistory.lastCooked = recipeHistory.entries[0].date;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        return recipeHistory;
    },

    // Delete an entry
    deleteEntry(recipeId, entryId) {
        const history = this.getAll();
        const recipeHistory = history[recipeId];
        if (!recipeHistory) return null;

        recipeHistory.entries = recipeHistory.entries.filter(e => e.id !== entryId);
        recipeHistory.count = recipeHistory.entries.length;

        if (recipeHistory.entries.length > 0) {
            recipeHistory.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            recipeHistory.lastCooked = recipeHistory.entries[0].date;
        } else {
            recipeHistory.lastCooked = null;
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        return recipeHistory;
    },

    // Mark a recipe as cooked (Legacy support/Simplified)
    markCooked(recipeId) {
        const today = new Date().toISOString().split('T')[0];
        return this.addEntry(recipeId, today, 'unknown');
    },

    // Get cook count for a recipe
    getCookCount(recipeId) {
        const entry = this.get(recipeId);
        return entry ? entry.count : 0;
    },

    // Get last cooked date for a recipe
    getLastCooked(recipeId) {
        const entry = this.get(recipeId);
        return entry ? entry.lastCooked : null;
    },

    // Get recently cooked recipes (sorted by last cooked date)
    getRecentlyCooked(limit = 10) {
        const history = this.getAll();
        return Object.entries(history)
            .filter(([_, data]) => data.lastCooked !== null)
            .map(([recipeId, data]) => ({ recipeId, ...data }))
            .sort((a, b) => new Date(b.lastCooked) - new Date(a.lastCooked))
            .slice(0, limit);
    },

    // Format last cooked date for display
    formatDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    },

    formatLastCooked(recipeId) {
        const lastCooked = this.getLastCooked(recipeId);
        return this.formatDate(lastCooked);
    },

    // Delete history for a recipe (Cleanup)
    deleteForRecipe(recipeId) {
        const history = this.getAll();
        if (history[recipeId]) {
            delete history[recipeId];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            return true;
        }
        return false;
    }
};

// Make available globally
window.Collections = Collections;
window.CookHistory = CookHistory;
