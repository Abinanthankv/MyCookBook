/**
 * Cookbook - Full Recipe Editor Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initEditor();
});

let editingRecipeId = null;

function initEditor() {
    // Check if we organic editing (id in URL) or creating new
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    // Handle "0" string or other falsy-looking but valid IDs
    editingRecipeId = rawId !== null ? decodeURIComponent(rawId) : null;

    console.log('Init Editor. Raw ID:', rawId, 'Parsed ID:', editingRecipeId);

    // DOM Elements
    const form = document.getElementById('recipeForm');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addStepBtn = document.getElementById('addStepBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const headerBackBtn = document.getElementById('headerBackBtn');

    // Event Listeners
    addIngredientBtn.addEventListener('click', () => addIngredientRow());
    addStepBtn.addEventListener('click', () => addStepRow());

    const discardChanges = () => {
        if (confirm('Discard changes and exit?')) {
            window.history.back();
        }
    };

    cancelBtn.addEventListener('click', discardChanges);
    headerBackBtn?.addEventListener('click', discardChanges);

    form.addEventListener('submit', handleFormSubmit);

    if (editingRecipeId) {
        loadRecipeForEditing(editingRecipeId);
    } else {
        // Start with some empty rows for new recipe
        for (let i = 0; i < 3; i++) addIngredientRow();
        for (let i = 0; i < 2; i++) addStepRow();
    }
}

function addIngredientRow(value = '') {
    const list = document.getElementById('ingredientsList');
    const row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = `
        <input type="text" class="ingredient-input modern-input" placeholder="e.g. 2 cups flour" value="${value}">
        <button type="button" class="remove-row-btn" title="Remove ingredient">✕</button>
    `;

    row.querySelector('.remove-row-btn').addEventListener('click', () => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(10px)';
        setTimeout(() => row.remove(), 250);
    });
    list.appendChild(row);
}

function addStepRow(stepData = null) {
    const list = document.getElementById('stepsList');
    const stepCount = list.querySelectorAll('.step-card').length + 1;

    const card = document.createElement('div');
    card.className = 'step-card';
    card.innerHTML = `
        <div class="step-header-row">
            <div class="step-number">${stepCount}</div>
            <button type="button" class="remove-row-btn" title="Remove step">✕</button>
        </div>
        <div class="form-field">
            <label class="field-label">STEP TITLE</label>
            <input type="text" class="step-title modern-input" placeholder="e.g. Prep Ingredients" value="${stepData?.title || ''}">
        </div>
        <div class="form-field">
            <label class="field-label">INSTRUCTIONS</label>
            <textarea class="step-desc modern-textarea" rows="2" placeholder="Describe what to do...">${stepData?.description || ''}</textarea>
        </div>
        <div class="form-grid">
            <div class="form-field">
                <label class="field-label">TIMER (MINS)</label>
                <input type="number" class="step-timer modern-input" value="${stepData?.timerMinutes || 0}">
            </div>
            <div class="form-field">
                <label class="field-label">YOUTUBE TIMESTAMP</label>
                <input type="text" class="step-time modern-input" placeholder="0:00" value="${stepData?.startTime || ''}">
            </div>
        </div>
    `;

    card.querySelector('.remove-row-btn').addEventListener('click', () => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(10px)';
        setTimeout(() => {
            card.remove();
            updateStepNumbers();
        }, 250);
    });
    list.appendChild(card);
}

function updateStepNumbers() {
    const steps = document.querySelectorAll('#stepsList .step-number');
    steps.forEach((num, i) => {
        num.textContent = i + 1;
    });
}

function loadRecipeForEditing(id) {
    const recipe = CustomRecipes.getById(id);
    if (!recipe) {
        alert('Recipe not found!');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('editorTitle').textContent = 'Edit Recipe';

    // Basic Info
    document.getElementById('title').value = recipe.title || '';
    document.getElementById('description').value = recipe.description || '';
    document.getElementById('category').value = recipe.category || 'dinner';
    document.getElementById('difficulty').value = recipe.difficulty || 'medium';
    document.getElementById('servings').value = recipe.servings || 4;

    // Timing
    document.getElementById('prepTime').value = recipe.prepTime || '';
    document.getElementById('cookTime').value = recipe.cookTime || '';
    document.getElementById('totalTime').value = recipe.totalTime || '';

    // Media
    document.getElementById('image').value = recipe.image || '';
    document.getElementById('videoUrl').value = recipe.videoUrl || '';

    // Ingredients
    document.getElementById('ingredientsList').innerHTML = '';
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    ingredients.forEach(i => addIngredientRow(i));

    // Steps
    document.getElementById('stepsList').innerHTML = '';
    const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
    steps.forEach(s => addStepRow(s));

    // Nutrition
    if (recipe.nutrition) {
        document.getElementById('calories').value = recipe.nutrition.calories || '';
        document.getElementById('protein').value = recipe.nutrition.protein || '';
        document.getElementById('fat').value = recipe.nutrition.fat || '';
        document.getElementById('carbs').value = recipe.nutrition.carbs || '';
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const recipe = {
        id: editingRecipeId,
        isCustom: true,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        difficulty: document.getElementById('difficulty').value,
        servings: parseInt(document.getElementById('servings').value) || 4,
        prepTime: document.getElementById('prepTime').value,
        cookTime: document.getElementById('cookTime').value,
        totalTime: document.getElementById('totalTime').value,
        image: document.getElementById('image').value || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80',
        videoUrl: document.getElementById('videoUrl').value,
        ingredients: Array.from(document.querySelectorAll('.ingredient-input')).map(input => input.value).filter(v => v.trim()),
        steps: Array.from(document.querySelectorAll('.step-card')).map((card, i) => ({
            step: i + 1,
            title: card.querySelector('.step-title').value,
            description: card.querySelector('.step-desc').value,
            timerMinutes: parseInt(card.querySelector('.step-timer').value) || 0,
            startTime: card.querySelector('.step-time').value
        })),
        nutrition: {
            calories: document.getElementById('calories').value,
            protein: document.getElementById('protein').value,
            fat: document.getElementById('fat').value,
            carbs: document.getElementById('carbs').value
        }
    };

    let result;
    if (editingRecipeId) {
        result = CustomRecipes.update(recipe);
    } else {
        result = CustomRecipes.save(recipe);
        if (result && result.id) editingRecipeId = result.id;
    }

    if (result) {
        showToast('✅ Recipe saved successfully!');
        // Redirect after a short delay to the new/edited recipe page
        setTimeout(() => {
            window.location.href = `recipe.html?id=${editingRecipeId}`;
        }, 800);
    } else {
        alert('Failed to save recipe. Please try again.');
    }
}
