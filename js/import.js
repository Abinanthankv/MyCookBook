/**
 * Cookbook Site - JSON Recipe Import
 */

// ========================================
// Custom Recipes Storage
// ========================================

const CustomRecipes = {
    STORAGE_KEY: 'cookbook-custom-recipes',

    getAll() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    save(recipe) {
        const recipes = this.getAll();
        // Generate unique ID with timestamp + random suffix
        recipe.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        recipe.isCustom = true;
        recipes.push(recipe);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
        return recipe;
    },

    delete(id) {
        let recipes = this.getAll();
        recipes = recipes.filter(r => r.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    }
};

// Store the original recipe for preserving all fields
let originalRecipe = null;

// ========================================
// File Upload Handling
// ========================================

function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');

    if (!dropZone || !fileInput) return;

    // Browse button click
    browseBtn.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

function handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.json')) {
        showError('Please upload a JSON file');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            validateAndProcess(data);
        } catch (error) {
            showError('Invalid JSON format. Please check your file.');
        }
    };

    reader.onerror = () => {
        showError('Failed to read file');
    };

    reader.readAsText(file);
}

// Store recipes for batch import
let recipesToImport = [];

function validateAndProcess(data) {
    // Handle different JSON formats
    let recipes = [];

    // Format 1: Array of recipes
    if (Array.isArray(data)) {
        recipes = data;
    }
    // Format 2: Object with "recipes" array (like recipes.json)
    else if (data.recipes && Array.isArray(data.recipes)) {
        recipes = data.recipes;
    }
    // Format 3: Single recipe object
    else if (data.title) {
        recipes = [data];
    }
    else {
        showError('Invalid format. Expected recipe object or array of recipes.');
        return;
    }

    // Validate all recipes have titles
    const invalidRecipes = recipes.filter(r => !r.title);
    if (invalidRecipes.length > 0) {
        showError(`${invalidRecipes.length} recipe(s) are missing titles.`);
        return;
    }

    recipesToImport = recipes;

    // Show preview
    if (recipes.length === 1) {
        // Single recipe - show editable preview
        originalRecipe = recipes[0];
        showPreview(recipes[0]);
    } else {
        // Multiple recipes - show summary
        showBatchPreview(recipes);
    }
}

function showBatchPreview(recipes) {
    hideError();
    document.getElementById('recipePreview').style.display = 'block';

    // Populate with summary
    document.getElementById('previewTitle').value = `${recipes.length} Recipes to Import`;
    document.getElementById('previewDescription').value = recipes.map(r => `• ${r.title}`).join('\n');
    document.getElementById('previewCategory').value = 'dinner';
    document.getElementById('previewDifficulty').value = 'medium';
    document.getElementById('previewServings').value = recipes.length;

    const totalIngredients = recipes.reduce((sum, r) => sum + (r.ingredients?.length || 0), 0);
    document.getElementById('previewIngredients').value = `Total: ${totalIngredients} ingredients across ${recipes.length} recipes`;
    document.getElementById('ingredientCount').textContent = totalIngredients;

    const totalSteps = recipes.reduce((sum, r) => sum + (r.steps?.length || 0), 0);
    document.getElementById('previewSteps').value = `Total: ${totalSteps} steps across ${recipes.length} recipes`;
    document.getElementById('stepCount').textContent = totalSteps;

    document.getElementById('previewImage').value = '';
    document.getElementById('previewVideoUrl').value = '';
}

// ========================================
// UI Handlers
// ========================================

function showError(message) {
    document.getElementById('recipePreview').style.display = 'none';
    document.getElementById('importError').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function hideError() {
    document.getElementById('importError').style.display = 'none';
}

function showPreview(recipe) {
    hideError();
    document.getElementById('recipePreview').style.display = 'block';

    // Populate form
    document.getElementById('previewTitle').value = recipe.title || '';
    document.getElementById('previewDescription').value = recipe.description || '';
    document.getElementById('previewCategory').value = recipe.category || 'dinner';
    document.getElementById('previewDifficulty').value = recipe.difficulty || 'medium';
    document.getElementById('previewServings').value = recipe.servings || 4;

    const ingredients = recipe.ingredients || [];
    document.getElementById('previewIngredients').value = ingredients.join('\n');
    document.getElementById('ingredientCount').textContent = ingredients.length;

    const steps = recipe.steps || [];
    document.getElementById('previewSteps').value = steps
        .map(s => `${s.title || 'Step ' + s.step}: ${s.description}`)
        .join('\n');
    document.getElementById('stepCount').textContent = steps.length;

    document.getElementById('previewImage').value = recipe.image || '';
    document.getElementById('previewVideoUrl').value = recipe.videoUrl || '';
}

function getRecipeFromForm() {
    // Get basic fields from form
    const title = document.getElementById('previewTitle').value;
    const description = document.getElementById('previewDescription').value;
    const category = document.getElementById('previewCategory').value;
    const difficulty = document.getElementById('previewDifficulty').value;
    const servings = parseInt(document.getElementById('previewServings').value) || 4;
    const ingredients = document.getElementById('previewIngredients').value.split('\n').filter(i => i.trim());
    const image = document.getElementById('previewImage').value || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80';
    const videoUrl = document.getElementById('previewVideoUrl').value || '';

    // Use original steps to preserve startTime, endTime, timerMinutes, tips
    let steps = [];
    if (originalRecipe && originalRecipe.steps) {
        // Keep original steps with all their data
        steps = originalRecipe.steps;
    } else {
        // Parse from text if no original
        const stepsText = document.getElementById('previewSteps').value;
        steps = stepsText.split('\n').filter(s => s.trim()).map((line, i) => {
            const [stepTitle, ...descParts] = line.split(':');
            return {
                step: i + 1,
                title: stepTitle.trim(),
                description: descParts.join(':').trim() || stepTitle.trim()
            };
        });
    }

    return {
        id: originalRecipe?.id || null,
        title,
        description,
        category,
        difficulty,
        servings,
        prepTime: originalRecipe?.prepTime || '15 mins',
        cookTime: originalRecipe?.cookTime || '30 mins',
        totalTime: originalRecipe?.totalTime || '45 mins',
        ingredients,
        steps,
        image,
        videoUrl
    };
}

// ========================================
// Initialize Import Page
// ========================================

function initImportPage() {
    if (!document.getElementById('dropZone')) return;

    initFileUpload();
    initPasteJsonImport();

    // Show/hide format info
    document.getElementById('showFormatBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('formatInfo').style.display = 'block';
    });

    document.getElementById('hideFormatBtn')?.addEventListener('click', () => {
        document.getElementById('formatInfo').style.display = 'none';
    });

    // YouTube Prompt Generator
    initPromptGenerator();

    // Cancel button
    document.getElementById('cancelImport')?.addEventListener('click', () => {
        document.getElementById('recipePreview').style.display = 'none';
        document.getElementById('fileInput').value = '';
        originalRecipe = null;
        recipesToImport = [];
    });

    // Save recipe button
    document.getElementById('saveRecipe')?.addEventListener('click', () => {
        let savedCount = 0;

        if (recipesToImport.length > 1) {
            // Batch import - save all recipes
            recipesToImport.forEach(recipe => {
                CustomRecipes.save(recipe);
                savedCount++;
            });
        } else {
            // Single recipe - get from form
            const recipe = getRecipeFromForm();
            CustomRecipes.save(recipe);
            savedCount = 1;
        }

        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = savedCount > 1
            ? `✅ ${savedCount} recipes saved to cookbook!`
            : '✅ Recipe saved to cookbook!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);

        // Reset form
        document.getElementById('recipePreview').style.display = 'none';
        document.getElementById('fileInput').value = '';
        originalRecipe = null;
        recipesToImport = [];
    });

    // Retry button
    document.getElementById('retryBtn')?.addEventListener('click', hideError);
}

// ========================================
// YouTube Prompt Generator
// ========================================

function initPromptGenerator() {
    const generateBtn = document.getElementById('generatePromptBtn');
    const copyBtn = document.getElementById('copyPromptBtn');
    const urlInput = document.getElementById('youtubeUrl');

    if (!generateBtn) return;

    generateBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a YouTube URL');
            return;
        }

        const prompt = generateAIPrompt(url);
        document.getElementById('generatedPrompt').value = prompt;
        document.getElementById('promptOutput').style.display = 'block';
    });

    copyBtn?.addEventListener('click', async () => {
        const prompt = document.getElementById('generatedPrompt').value;
        try {
            await navigator.clipboard.writeText(prompt);
            document.getElementById('copyFeedback').textContent = '✓ Copied!';
            setTimeout(() => {
                document.getElementById('copyFeedback').textContent = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            document.getElementById('generatedPrompt').select();
            document.execCommand('copy');
            document.getElementById('copyFeedback').textContent = '✓ Copied!';
        }
    });
}

function generateAIPrompt(youtubeUrl) {
    return `I need you to extract a cooking recipe from this YouTube video and return it as JSON.

YouTube Video URL: ${youtubeUrl}

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
  "videoUrl": "${youtubeUrl}",
  "ingredients": [
    "1 cup ingredient",
    "2 tbsp ingredient"
  ],
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
- Return ONLY the JSON, no additional text
- Make sure the JSON is valid and properly formatted`;
}

// ========================================
// Paste JSON Import
// ========================================

function initPasteJsonImport() {
    const importBtn = document.getElementById('importPastedJson');
    const textarea = document.getElementById('pasteJsonInput');

    if (!importBtn || !textarea) return;

    importBtn.addEventListener('click', () => {
        const jsonText = textarea.value.trim();

        if (!jsonText) {
            showError('Please paste JSON recipe data');
            return;
        }

        try {
            const data = JSON.parse(jsonText);
            validateAndProcess(data);
            // Clear textarea on success
            textarea.value = '';
        } catch (error) {
            showError('Invalid JSON format. Please check your input.');
        }
    });
}

// Run on page load
initImportPage();
