const THEME_STORAGE_KEY = 'cookbook-theme';
const OVERRIDES_STORAGE_KEY = 'cookbook-theme-overrides';

let recipesToImport = [];
let originalRecipe = null;

document.addEventListener('DOMContentLoaded', () => {
    initThemeSelection();
    initThemeEditor();
    initDataManagement();
});

// View Switching
function showCategory(catId) {
    document.getElementById('settingsMenu').classList.remove('active');
    document.getElementById('settingsMenu').style.display = 'none';

    // Hide all categories first
    document.querySelectorAll('.category-view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected category
    const target = document.getElementById(`cat-${catId}`);
    if (target) {
        target.classList.add('active');
    }
}

function showMenu() {
    document.querySelectorAll('.category-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById('settingsMenu').style.display = 'flex';
    document.getElementById('settingsMenu').classList.add('active');
}

// Appearance Logic
function initThemeSelection() {
    const themeCards = document.querySelectorAll('.theme-card-v3');
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'zesty-garden';

    themeCards.forEach(card => {
        if (card.dataset.theme === currentTheme) card.classList.add('active');

        card.addEventListener('click', () => {
            const newTheme = card.dataset.theme;
            themeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // LIVE APPLY via global ThemeManager
            if (window.ThemeManager) {
                window.ThemeManager.apply(newTheme);
            }

            initThemeEditor(); // Refresh editor values for new theme
            showToast(`Studio Style: ${card.querySelector('h3').textContent}`);

            // Scroll to editor if custom is selected
            if (newTheme === 'custom') {
                document.getElementById('themeEditor').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initThemeEditor() {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'zesty-garden';
    const controls = {
        primary: { input: document.getElementById('colorPrimary'), val: document.getElementById('valPrimary'), var: '--color-primary' },
        secondary: { input: document.getElementById('colorSecondary'), val: document.getElementById('valSecondary'), var: '--color-secondary' },
        tertiary: { input: document.getElementById('colorTertiary'), val: document.getElementById('valTertiary'), var: '--color-tertiary' },
        surface: { input: document.getElementById('colorSurface'), val: document.getElementById('valSurface'), var: '--color-bg' }
    };

    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    const themeOverrides = overrides[currentTheme] || {};

    Object.keys(controls).forEach(key => {
        const ctrl = controls[key];
        const color = themeOverrides[ctrl.var] || getComputedColor(ctrl.var);

        if (ctrl.input) {
            ctrl.input.value = color;
            ctrl.val.textContent = color.toUpperCase();

            // No separate visual background needed as input wrapper handles it or input itself
            // but let's ensure the wrapper or parent looks right if needed.
            // In the new design, the picker is usually hidden or takes full space.

            ctrl.input.oninput = (e) => {
                const newColor = e.target.value;
                ctrl.val.textContent = newColor.toUpperCase();

                // Live Preview - apply to document immediately
                document.documentElement.style.setProperty(ctrl.var, newColor);
                if (key === 'primary') {
                    document.documentElement.style.setProperty('--color-primary-soft', `${newColor}1a`);
                }

                saveOverride(currentTheme, ctrl.var, newColor);

                // If it's the custom theme, update the gallery palette too
                if (currentTheme === 'custom') updateCustomPalette(ctrl.var, newColor);
            };
        }
    });

    document.getElementById('resetThemeBtn').onclick = () => {
        const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
        delete overrides[currentTheme];
        localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));

        // Re-apply defaults without reload
        if (window.ThemeManager) {
            window.ThemeManager.apply(currentTheme);
        }
        initThemeEditor();

        if (currentTheme === 'custom') {
            // Reset custom palette swatches to neutral
            updateCustomPalette('--color-primary', '#2D6A4F');
            updateCustomPalette('--color-secondary', '#B7E4C7');
            updateCustomPalette('--color-tertiary', '#FFD60A');
            updateCustomPalette('--color-bg', '#FBFFF1');
        }

        showToast('Reset Laboratory Defaults');
    };

    // Initial sync of custom palette if active
    if (localStorage.getItem(THEME_STORAGE_KEY) === 'custom') {
        Object.keys(controls).forEach(key => {
            const ctrl = controls[key];
            const color = themeOverrides[ctrl.var] || getComputedColor(ctrl.var);
            updateCustomPalette(ctrl.var, color);
        });
    }
}

function updateCustomPalette(varName, color) {
    const preview = document.getElementById('customPalettePreview');
    if (!preview) return;

    const swatches = preview.querySelectorAll('.swatch');
    if (varName === '--color-primary') swatches[0].style.backgroundColor = color;
    else if (varName === '--color-secondary') swatches[1].style.backgroundColor = color;
    else if (varName === '--color-tertiary') swatches[2].style.backgroundColor = color;
    else if (varName === '--color-bg') swatches[3].style.backgroundColor = color;
}

function getComputedColor(varName) {
    let color = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (color.startsWith('rgb')) {
        const rgb = color.match(/\d+/g);
        return '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }
    return color || '#000000';
}

function saveOverride(themeId, varName, color) {
    const overrides = JSON.parse(localStorage.getItem(OVERRIDES_STORAGE_KEY) || '{}');
    if (!overrides[themeId]) overrides[themeId] = {};
    overrides[themeId][varName] = color;
    if (varName === '--color-primary') overrides[themeId]['--color-primary-soft'] = `${color}1a`;
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

// Data Management Logic (Integrated from import.js)
function initDataManagement() {
    initExport();
    initImport();
    initPromptGenerator();
}

function initExport() {
    const exportBtn = document.getElementById('exportAllBtn');
    if (!exportBtn) return;
    exportBtn.onclick = () => {
        const recipes = CustomRecipes.getAll();
        if (recipes.length === 0) {
            showToast('No custom recipes to export');
            return;
        }
        const dataStr = JSON.stringify({ recipes }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookbook-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${recipes.length} recipes!`);
    };
}

function initImport() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const pasteBtn = document.getElementById('importPastedJson');

    if (browseBtn) browseBtn.onclick = () => fileInput.click();
    if (fileInput) fileInput.onchange = (e) => handleFile(e.target.files[0]);
    if (pasteBtn) pasteBtn.onclick = () => {
        const json = document.getElementById('pasteJsonInput').value.trim();
        if (json) try { validateAndProcess(JSON.parse(json)); } catch (e) { showToast('Invalid JSON format'); }
    };

    if (dropZone) {
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = '#2D6A4F'; };
        dropZone.ondragleave = () => dropZone.style.borderColor = '#E8F5E9';
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#E8F5E9';
            handleFile(e.dataTransfer.files[0]);
        };
    }

    document.getElementById('saveRecipe').onclick = () => {
        const title = document.getElementById('previewTitle').value;
        const description = document.getElementById('previewDescription').value;
        const recipe = { ...originalRecipe, title, description };
        CustomRecipes.save(recipe);
        document.getElementById('recipePreview').style.display = 'none';
        showToast('Recipe Saved!');
    };
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => validateAndProcess(JSON.parse(e.target.result));
    reader.readAsText(file);
}

function validateAndProcess(data) {
    const recipes = Array.isArray(data) ? data : (data.recipes || [data]);
    if (recipes.length === 1) {
        originalRecipe = recipes[0];
        document.getElementById('previewTitle').value = originalRecipe.title || '';
        document.getElementById('previewDescription').value = originalRecipe.description || '';
        document.getElementById('recipePreview').style.display = 'flex';
    } else {
        recipes.forEach(r => CustomRecipes.save(r));
        showToast(`Imported ${recipes.length} recipes!`);
    }
}

function initPromptGenerator() {
    const genBtn = document.getElementById('generatePromptBtn');
    if (!genBtn) return;
    genBtn.onclick = () => {
        const url = document.getElementById('youtubeUrl').value.trim();
        if (!url) return showToast('Enter a YouTube URL');

        const prompt = `I need you to extract a cooking recipe from this YouTube video and return it as JSON.

YouTube Video URL: ${url}

Please watch/analyze the video and extract the recipe in this exact JSON format:

{
  "id": "unique-recipe-id",
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "category": "breakfast|lunch|dinner|dessert",
  "difficulty": "easy|medium|hard",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "totalTime": "X mins",
  "servings": 4,
  "image": "thumbnail URL from video",
  "videoUrl": "${url}",
  "ingredients": [
    "1 cup ingredient",
    "2 tbsp ingredient"
  ],
  "nutrition": {
    "calories": "350kcal",
    "carbs": "45g",
    "fat": "12g",
    "protein": "18g"
  },
  "steps": [
    {
      "step": 1,
      "title": "Step Title",
      "description": "Detailed step instructions",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "timerMinutes": 5,
      "tip": "Optional helpful tip"
    }
  ]
}

Important:
- Include video timestamps (startTime/endTime) for each step if possible
- Add timerMinutes for steps that require waiting (cooking, resting, etc.)
- Estimate nutrition values (calories, carbs, fat, protein) based on ingredients
- Return ONLY the JSON, no additional text
- Make sure the JSON is valid and properly formatted`;

        document.getElementById('generatedPrompt').value = prompt;
        document.getElementById('promptOutput').style.display = 'block';
    };
    document.getElementById('copyPromptBtn').onclick = () => {
        const text = document.getElementById('generatedPrompt').value;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Prompt Copied!');
        });
    };
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
