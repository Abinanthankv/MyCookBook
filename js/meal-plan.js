/**
 * Meal Plan Page Logic
 */

const MealPlanUI = {
    currentDate: new Date(),
    selectedDate: new Date().toISOString().split('T')[0],

    init() {
        this.renderCalendar();
        this.renderPlannedMeals(this.selectedDate);
        this.renderWeeklyDashboard();
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('closePicker').addEventListener('click', () => {
            document.getElementById('recipePickerModal').classList.remove('active');
        });

        document.getElementById('pickerSearch').addEventListener('input', (e) => {
            this.renderRecipePicker(e.target.value);
        });
    },

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthLabel = document.getElementById('currentMonth');
        if (!grid || !monthLabel) return;

        grid.innerHTML = '';
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        monthLabel.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.currentDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for previous month padding
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        // Add actual days
        const today = new Date().toISOString().split('T')[0];
        const history = typeof CookHistory !== 'undefined' ? CookHistory.getAll() : {};

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            if (dateStr === today) dayCell.classList.add('today');
            if (dateStr === this.selectedDate) dayCell.classList.add('selected');

            dayCell.innerHTML = `<span class="day-number">${d}</span>`;

            // Render Heatmap dots (Historical)
            const historicalEntries = this.getHistoricalEntriesForDate(dateStr, history);
            if (historicalEntries.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'day-dots';

                // Group by meal type
                const meals = [...new Set(historicalEntries.map(e => e.meal))];
                meals.forEach(meal => {
                    const dot = document.createElement('span');
                    dot.className = `dot ${meal}`;
                    dotsContainer.appendChild(dot);
                });
                dayCell.appendChild(dotsContainer);
            }

            // Future indicators
            const planned = MealPlan.getForDate(dateStr);
            if (Object.values(planned).some(arr => arr.length > 0)) {
                dayCell.classList.add('has-plans');
            }

            dayCell.addEventListener('click', () => {
                this.selectedDate = dateStr;
                this.renderCalendar(); // Re-render to update selection
                this.renderPlannedMeals(dateStr);
            });

            grid.appendChild(dayCell);
        }
    },

    getHistoricalEntriesForDate(dateStr, history) {
        const entries = [];
        for (const recipeId in history) {
            const items = history[recipeId].entries.filter(e => e.date === dateStr);
            items.forEach(item => entries.push({ recipeId, ...item }));
        }
        return entries;
    },

    calculateWeeklyNutrition() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const totals = { calories: 0, protein: 0, carbs: 0 };
        const contributorsMap = {};

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayNutrition = this.getNutritionForDate(dateStr);

            totals.calories += dayNutrition.totals.calories;
            totals.protein += dayNutrition.totals.protein;
            totals.carbs += dayNutrition.totals.carbs;

            dayNutrition.contributors.forEach(c => {
                if (!contributorsMap[c.id]) {
                    contributorsMap[c.id] = { ...c };
                } else {
                    contributorsMap[c.id].count += c.count;
                }
            });
        }

        return { totals, contributors: Object.values(contributorsMap) };
    },

    getNutritionForDate(dateStr) {
        const history = typeof CookHistory !== 'undefined' ? CookHistory.getAll() : {};
        const plans = MealPlan.getForDate(dateStr);
        const totals = { calories: 0, protein: 0, carbs: 0 };
        const contributors = {};
        const processedSlots = new Set();

        const add = (recipeId, mealType) => {
            const recipe = typeof getRecipeById !== 'undefined' ? getRecipeById(recipeId) : null;
            const slotKey = `${dateStr}-${mealType}-${recipeId}`;
            if (recipe && recipe.nutrition && !processedSlots.has(slotKey)) {
                const parse = (v) => parseInt(String(v).replace(/\D/g, '')) || 0;
                const c = parse(recipe.nutrition.calories);
                const p = parse(recipe.nutrition.protein);
                const cb = parse(recipe.nutrition.carbs);

                totals.calories += c;
                totals.protein += p;
                totals.carbs += cb;

                if (!contributors[recipe.id]) {
                    contributors[recipe.id] = { id: recipe.id, title: recipe.title, count: 0, c, p };
                }
                contributors[recipe.id].count++;
                processedSlots.add(slotKey);
            }
        };

        const historical = this.getHistoricalEntriesForDate(dateStr, history);
        historical.forEach(e => add(e.recipeId, e.meal));

        for (const type in plans) {
            plans[type].forEach(id => add(id, type));
        }

        return { totals, contributors: Object.values(contributors) };
    },

    renderWeeklyDashboard() {
        const container = document.getElementById('nutritionDashboard');
        if (!container) return;

        const weekly = this.calculateWeeklyNutrition();
        const daily = this.getNutritionForDate(this.selectedDate);

        const goalsDaily = { calories: 2000, protein: 50, carbs: 275 };
        const goalsWeekly = { calories: 2000 * 7, protein: 50 * 7, carbs: 275 * 7 };

        container.innerHTML = `
            <div class="nutrition-dashboard-grid">
                <div class="nutrition-card daily">
                    <div class="nutrition-card-header">
                        <h2 class="section-title">Day Summary</h2>
                        <span class="date-label">${new Date(this.selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="nutrition-stats-stack">
                        ${this.renderStatItem('🔥 Calories', daily.totals.calories, goalsDaily.calories, 'calories', 'kcal')}
                        ${this.renderStatItem('🍗 Protein', daily.totals.protein, goalsDaily.protein, 'protein', 'g')}
                        ${this.renderStatItem('🍞 Carbs', daily.totals.carbs, goalsDaily.carbs, 'carbs', 'g')}
                    </div>
                </div>

                <div class="nutrition-card weekly">
                    <div class="nutrition-card-header">
                        <h2 class="section-title">Weekly Summary</h2>
                        <span class="week-label">This Week</span>
                    </div>
                    <div class="nutrition-stats-stack">
                        ${this.renderStatItem('🔥 Calories', weekly.totals.calories, goalsWeekly.calories, 'calories', 'kcal')}
                        ${this.renderStatItem('🍗 Protein', weekly.totals.protein, goalsWeekly.protein, 'protein', 'g')}
                        ${this.renderStatItem('🍞 Carbs', weekly.totals.carbs, goalsWeekly.carbs, 'carbs', 'g')}
                    </div>
                </div>

                <div class="nutrition-card contributions">
                    <h3 class="breakdown-title">Receipe Contributions (Weekly)</h3>
                    <div class="breakdown-grid">
                        ${weekly.contributors.length > 0 ? weekly.contributors.map(r => `
                            <div class="breakdown-pill">
                                <span class="recipe-name">${r.title}</span>
                                <span class="recipe-meta">${r.count}x • ${r.c * r.count}cal</span>
                            </div>
                        `).join('') : '<p class="no-data">Add recipes to your plan to see contributions</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    renderStatItem(label, value, goal, cls, unit) {
        const pct = Math.min(Math.round((value / goal) * 100), 100);
        return `
            <div class="stat-item">
                <div class="stat-header">
                    <span class="stat-label">${label}</span>
                    <span class="stat-value">${value}/${goal} ${unit}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${cls}" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    },

    renderPlannedMeals(date) {
        const container = document.getElementById('plannedMealsList');
        if (!container) return;

        const dateObj = new Date(date);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);

        const plans = MealPlan.getForDate(date);
        const historyEntries = this.getHistoricalEntriesForDate(date, typeof CookHistory !== 'undefined' ? CookHistory.getAll() : {});

        let html = `
            <div class="planned-date-header">
                <h3>${formattedDate}</h3>
            </div>
            <div class="meal-slots">
        `;

        const mealTypes = [
            { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
            { id: 'lunch', label: 'Lunch', icon: '🥗' },
            { id: 'dinner', label: 'Dinner', icon: '🍽️' },
            { id: 'snack', label: 'Snack', icon: '🥨' }
        ];

        mealTypes.forEach(meal => {
            const plannedIds = plans[meal.id] || [];
            const historical = historyEntries.filter(e => e.meal === meal.id);

            html += `
                <div class="meal-slot">
                    <div class="meal-slot-header">
                        <span class="meal-type-label">${meal.icon} ${meal.label}</span>
                        <button class="add-meal-btn" onclick="MealPlanUI.openRecipePicker('${date}', '${meal.id}')">+</button>
                    </div>
                    <div class="meal-items">
                        ${this.renderMealItems(plannedIds, historical, date, meal.id)}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    renderMealItems(plannedIds, historical, date, mealType) {
        let itemsHtml = '';

        // Render planned (Future)
        plannedIds.forEach(id => {
            const recipe = typeof getRecipeById !== 'undefined' ? getRecipeById(id) : null;
            if (recipe) {
                itemsHtml += `
                    <div class="meal-item planned">
                        <a href="recipe.html?id=${id}" class="recipe-link">
                            <span class="recipe-name">${recipe.title}</span>
                        </a>
                        <div class="meal-item-actions">
                            <span class="status-tag planned">Planned</span>
                            <button class="remove-meal-btn" onclick="MealPlanUI.removePlan('${date}', '${mealType}', '${id}')">✕</button>
                        </div>
                    </div>
                `;
            }
        });

        // Render historical (Completed)
        historical.forEach(entry => {
            const recipe = typeof getRecipeById !== 'undefined' ? getRecipeById(entry.recipeId) : null;
            if (recipe) {
                itemsHtml += `
                    <div class="meal-item cooked">
                        <a href="recipe.html?id=${entry.recipeId}" class="recipe-link">
                            <span class="recipe-name">${recipe.title}</span>
                        </a>
                        <div class="meal-item-actions">
                            <span class="status-tag cooked">Cooked</span>
                        </div>
                    </div>
                `;
            }
        });

        if (itemsHtml === '') {
            itemsHtml = '<p class="no-meals">No meals planned</p>';
        }

        return itemsHtml;
    },

    openRecipePicker(date, mealType) {
        this.pickerTarget = { date, mealType };
        document.getElementById('recipePickerModal').classList.add('active');
        this.renderRecipePicker();
    },

    renderRecipePicker(search = '') {
        const grid = document.getElementById('pickerGrid');
        if (!grid) return;

        const recipes = typeof allRecipes !== 'undefined' ? allRecipes : [];
        const filtered = recipes.filter(r =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.category.toLowerCase().includes(search.toLowerCase())
        );

        grid.innerHTML = filtered.map(recipe => `
            <div class="picker-item" onclick="MealPlanUI.selectRecipe('${recipe.id}')">
                <img src="${recipe.image}" alt="${recipe.title}">
                <span>${recipe.title}</span>
            </div>
        `).join('');
    },

    selectRecipe(recipeId) {
        const { date, mealType } = this.pickerTarget;
        const today = new Date().toISOString().split('T')[0];

        if (date < today) {
            // Past date: Record in history
            if (typeof CookHistory !== 'undefined') {
                CookHistory.addEntry(recipeId, date, mealType);
                showToast('✅ Added to cooking history');
            } else {
                showToast('❌ History system not available');
            }
        } else {
            // Future or today: Add to meal plan
            MealPlan.addRecipe(date, mealType, recipeId);
            showToast('📍 Recipe added to meal plan');
        }

        document.getElementById('recipePickerModal').classList.remove('active');
        this.renderPlannedMeals(date);
        this.renderCalendar();
        this.renderWeeklyDashboard();
    },

    removePlan(date, mealType, recipeId) {
        MealPlan.removeRecipe(date, mealType, recipeId);
        this.renderPlannedMeals(date);
        this.renderCalendar();
        this.renderWeeklyDashboard();
    }
};

// Initialize after recipe data is loaded
window.addEventListener('load', () => {
    // We wait for app.js loadRecipes to complete if possible, 
    // but app.js calls initHomepage on load. 
    // On meal-plan.html, we don't have recipeGrid, so initHomepage returns early.
    // We need to call loadRecipes manually here if not already done.
    if (typeof loadRecipes === 'function') {
        loadRecipes().then(() => {
            MealPlanUI.init();
        });
    }
});
