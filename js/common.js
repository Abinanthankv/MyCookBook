/**
 * Cookbook Site - Common Shared Logic
 */

(function () {
    // Immediate Theme Initialization
    function initAppTheme() {
        const storageKey = 'cookbook-theme';
        const overridesKey = 'cookbook-theme-overrides';
        const legacyKey = 'theme';
        let theme = localStorage.getItem(storageKey);

        if (!theme) {
            // Migration/Fallback from old light/dark system
            const legacy = localStorage.getItem(legacyKey);
            theme = legacy === 'dark' ? 'modern-bistro' : 'fresh-harvest';
            localStorage.setItem(storageKey, theme);
        }

        // Apply base theme class
        document.documentElement.setAttribute('data-theme', theme);

        // Apply custom overrides if they exist
        const overrides = JSON.parse(localStorage.getItem(overridesKey) || '{}');
        const themeOverrides = overrides[theme];
        if (themeOverrides) {
            Object.keys(themeOverrides).forEach(prop => {
                document.documentElement.style.setProperty(prop, themeOverrides[prop]);
            });
        }
    }

    initAppTheme();
})();

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
