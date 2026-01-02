const THEME_STORAGE_KEY = 'cookbook-theme';
const OVERRIDES_STORAGE_KEY = 'cookbook-theme-overrides';

document.addEventListener('DOMContentLoaded', () => {
    initThemeSelection();
    initThemeEditor();
});

function initThemeSelection() {
    const themeCards = document.querySelectorAll('.theme-card');
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'fresh-harvest';

    // Mark active card
    themeCards.forEach(card => {
        if (card.dataset.theme === currentTheme) {
            card.classList.add('active');
        }

        card.addEventListener('click', () => {
            const newTheme = card.dataset.theme;

            // Update active state
            themeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Apply theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);

            // Refill editor for the new theme
            initThemeEditor();

            showToast(`Theme changed to ${card.querySelector('h3').textContent}`);
        });
    });
}

function initThemeEditor() {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'fresh-harvest';
    const controls = {
        primary: { input: document.getElementById('colorPrimary'), val: document.getElementById('valPrimary'), var: '--color-primary' },
        secondary: { input: document.getElementById('colorSecondary'), val: document.getElementById('valSecondary'), var: '--color-secondary' },
        tertiary: { input: document.getElementById('colorTertiary'), val: document.getElementById('valTertiary'), var: '--color-tertiary' },
        surface: { input: document.getElementById('colorSurface'), val: document.getElementById('valSurface'), var: '--color-bg' }
    };

    const resetBtn = document.getElementById('resetThemeBtn');
    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    const themeOverrides = overrides[currentTheme] || {};

    // Helper to get current computed color in hex
    function getComputedColor(varName) {
        let color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (color.startsWith('rgb')) {
            // Convert rgb to hex
            const rgb = color.match(/\d+/g);
            return '#' + rgb.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        return color || '#000000';
    }

    // Initialize inputs
    Object.keys(controls).forEach(key => {
        const ctrl = controls[key];
        const color = themeOverrides[ctrl.var] || getComputedColor(ctrl.var);

        ctrl.input.value = color;
        ctrl.val.textContent = color.toUpperCase();

        // Listen for changes
        ctrl.input.addEventListener('input', (e) => {
            const newColor = e.target.value;
            ctrl.val.textContent = newColor.toUpperCase();

            // Apply immediately
            document.documentElement.style.setProperty(ctrl.var, newColor);

            // If primary, also update soft color (with opacity)
            if (key === 'primary') {
                document.documentElement.style.setProperty('--color-primary-soft', `${newColor}1a`); // ~10% opacity
            }

            // Save override
            saveOverride(currentTheme, ctrl.var, newColor);

            // Update custom preview if applicable
            if (currentTheme === 'custom') updateCustomPreview();
        });
    });

    // Reset functionality
    resetBtn.onclick = () => {
        const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
        delete overrides[currentTheme];
        localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));

        // Clear inline styles and reload
        document.documentElement.removeAttribute('style');
        window.location.reload();
    };

    if (currentTheme === 'custom') updateCustomPreview();
}

function saveOverride(themeId, varName, color) {
    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    if (!overrides[themeId]) overrides[themeId] = {};
    overrides[themeId][varName] = color;

    // Auto-generate variants for better M3 experience
    if (varName === '--color-primary') {
        overrides[themeId]['--color-primary-soft'] = `${color}1a`; // 10% opacity
    }

    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

function updateCustomPreview() {
    const customPreview = document.getElementById('customPreview');
    if (!customPreview) return;

    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    const custom = overrides['custom'] || {};

    if (custom['--color-bg']) customPreview.style.backgroundColor = custom['--color-bg'];
    const p1 = customPreview.querySelector('.p-1');
    const p2 = customPreview.querySelector('.p-2');

    if (p1 && custom['--color-primary']) p1.style.backgroundColor = custom['--color-primary'];
    if (p2 && custom['--color-secondary']) p2.style.backgroundColor = custom['--color-secondary'];
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}
