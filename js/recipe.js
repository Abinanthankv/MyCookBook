/**
 * Cookbook Site - Recipe Detail Page Logic
 */

// ========================================
// Cooking Timer System
// ========================================

const CookingTimer = {
    intervalId: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    isRunning: false,
    stepName: '',
    widget: null,

    // Create and inject the timer widget HTML
    createWidget() {
        if (this.widget) return;

        const widgetHtml = `
            <div class="timer-widget hidden" id="timerWidget">
                <div class="timer-widget-header">
                    <span class="timer-widget-title">⏱️ Cooking Timer</span>
                    <button class="timer-widget-close" id="timerClose">✕</button>
                </div>
                <div class="timer-progress">
                    <svg width="120" height="120">
                        <circle class="timer-progress-circle" cx="60" cy="60" r="52"></circle>
                        <circle class="timer-progress-value" id="timerProgressValue" cx="60" cy="60" r="52" 
                            stroke-dasharray="326.7" stroke-dashoffset="0"></circle>
                    </svg>
                    <div class="timer-progress-text" id="timerProgressText">00:00</div>
                </div>
                <div class="timer-step-name" id="timerStepName">Step</div>
                <div class="timer-controls">
                    <button class="timer-control-btn primary" id="timerPlayPause">▶️ Start</button>
                    <button class="timer-control-btn secondary" id="timerReset">🔄 Reset</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);
        this.widget = document.getElementById('timerWidget');

        // Bind event listeners
        document.getElementById('timerClose').addEventListener('click', () => this.hide());
        document.getElementById('timerPlayPause').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('timerReset').addEventListener('click', () => this.reset());
    },

    // Start a new timer
    start(minutes, stepName) {
        this.createWidget();
        this.stop();

        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.stepName = stepName;
        this.isRunning = true;

        // Update UI
        document.getElementById('timerStepName').textContent = stepName;
        this.updateDisplay();
        this.updatePlayPauseButton();

        // Show widget
        this.widget.classList.remove('hidden', 'complete', 'paused');

        // Start countdown
        this.intervalId = setInterval(() => this.tick(), 1000);
    },

    // Timer tick (every second)
    tick() {
        if (!this.isRunning) return;

        this.remainingSeconds--;
        this.updateDisplay();

        if (this.remainingSeconds <= 0) {
            this.complete();
        }
    },

    // Update the display
    updateDisplay() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('timerProgressText').textContent = timeStr;

        // Update progress ring
        const circumference = 326.7; // 2 * PI * 52
        const progress = this.remainingSeconds / this.totalSeconds;
        const offset = circumference * (1 - progress);
        document.getElementById('timerProgressValue').style.strokeDashoffset = offset;
    },

    // Toggle play/pause
    togglePlayPause() {
        if (this.remainingSeconds <= 0) {
            this.reset();
            return;
        }

        this.isRunning = !this.isRunning;
        this.widget.classList.toggle('paused', !this.isRunning);
        this.updatePlayPauseButton();

        if (this.isRunning && !this.intervalId) {
            this.intervalId = setInterval(() => this.tick(), 1000);
        }
    },

    // Update play/pause button text
    updatePlayPauseButton() {
        const btn = document.getElementById('timerPlayPause');
        if (this.remainingSeconds <= 0) {
            btn.textContent = '🔄 Restart';
        } else if (this.isRunning) {
            btn.textContent = '⏸️ Pause';
        } else {
            btn.textContent = '▶️ Resume';
        }
    },

    // Reset timer
    reset() {
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = true;
        this.widget.classList.remove('complete', 'paused');
        this.updateDisplay();
        this.updatePlayPauseButton();

        if (!this.intervalId) {
            this.intervalId = setInterval(() => this.tick(), 1000);
        }
    },

    // Timer complete
    complete() {
        this.stop();
        this.widget.classList.add('complete');
        document.getElementById('timerProgressText').textContent = '✓ Done!';
        this.updatePlayPauseButton();

        // Play notification sound
        this.playNotification();
    },

    // Play notification sound
    playNotification() {
        // Try to play a notification sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create a pleasant chime sound
            const playTone = (freq, startTime, duration) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = freq;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioContext.currentTime;
            playTone(523.25, now, 0.2);       // C5
            playTone(659.25, now + 0.15, 0.2); // E5
            playTone(783.99, now + 0.3, 0.4);  // G5

        } catch (e) {
            console.log('Audio notification not available');
        }

        // Also try browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏱️ Timer Complete!', {
                body: `${this.stepName} is ready!`,
                icon: 'icons/icon-192.png'
            });
        }
    },

    // Stop timer
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    },

    // Hide widget
    hide() {
        this.stop();
        if (this.widget) {
            this.widget.classList.add('hidden');
        }
    }
};

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// ========================================
// Recipe Page Rendering
// ========================================

function renderRecipeHero(recipe) {
    const heroImage = document.getElementById('heroImage');
    const heroCategory = document.getElementById('heroCategory');
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');

    // Update page title
    document.title = `${recipe.title} | Cookbook`;

    heroImage.src = recipe.image;
    heroImage.alt = recipe.title;
    heroCategory.textContent = recipe.category;
    heroTitle.textContent = recipe.title;

    heroMeta.innerHTML = `
    <span>⏱️ Prep: ${recipe.prepTime}</span>
    <span>🔥 Cook: ${recipe.cookTime}</span>
    <span>👤 Serves: ${recipe.servings}</span>
    <span>📊 ${recipe.difficulty}</span>
  `;

    // Show play button if video exists
    const playBtn = document.getElementById('playVideoBtn');
    if (playBtn && recipe.videoUrl) {
        playBtn.style.display = 'flex';
        initVideoModal(recipe.videoUrl);
    }
}

// ========================================
// Video Modal
// ========================================

function initVideoModal(videoUrl) {
    const playBtn = document.getElementById('playVideoBtn');
    const modal = document.getElementById('videoModal');
    const closeBtn = document.getElementById('closeVideoBtn');
    const playerContainer = document.getElementById('videoModalPlayer');

    if (!playBtn || !modal) return;

    // Extract YouTube video ID
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return;

    // Open modal
    playBtn.addEventListener('click', () => {
        playerContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeBtn?.addEventListener('click', closeVideoModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeVideoModal();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeVideoModal();
        }
    });

    function closeVideoModal() {
        modal.classList.remove('active');
        playerContainer.innerHTML = '';
        document.body.style.overflow = '';
    }
}

function renderIngredients(ingredients) {
    const list = document.getElementById('ingredientsList');

    list.innerHTML = ingredients.map((ingredient, index) => `
    <label class="ingredient-item">
      <input type="checkbox" class="ingredient-checkbox" id="ing-${index}">
      <span class="ingredient-text">${ingredient}</span>
    </label>
  `).join('');

    // Save checked state to localStorage
    const checkboxes = list.querySelectorAll('.ingredient-checkbox');
    const recipeId = getUrlParam('id');
    const saved = JSON.parse(localStorage.getItem(`ingredients-${recipeId}`) || '[]');

    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = saved.includes(index);
        checkbox.addEventListener('change', () => {
            const checked = Array.from(checkboxes)
                .map((cb, i) => cb.checked ? i : null)
                .filter(i => i !== null);
            localStorage.setItem(`ingredients-${recipeId}`, JSON.stringify(checked));
        });
    });
}

function renderSteps(steps, videoUrl) {
    const list = document.getElementById('stepsList');

    list.innerHTML = steps.map(step => {
        // Check if step has video timing
        const hasVideo = videoUrl && step.startTime !== undefined;

        let mediaHtml;
        if (hasVideo) {
            // Create YouTube embed with timestamp
            const videoId = extractYouTubeId(videoUrl);
            const startSeconds = timeToSeconds(step.startTime);
            const endSeconds = step.endTime ? timeToSeconds(step.endTime) : null;

            // Build embed URL with parameters
            let embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startSeconds}`;
            if (endSeconds) {
                embedUrl += `&end=${endSeconds}`;
            }
            embedUrl += '&rel=0&modestbranding=1';

            mediaHtml = `
                <div class="step-video-container">
                    <iframe 
                        class="step-video"
                        src="${embedUrl}"
                        title="Step ${step.step}: ${step.title}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                    <div class="step-video-time">
                        <span>📍 ${step.startTime}${step.endTime ? ` - ${step.endTime}` : ''}</span>
                    </div>
                </div>
            `;
        } else if (step.image) {
            // Fallback to image
            mediaHtml = `<img src="${step.image}" alt="Step ${step.step}" class="step-image" loading="lazy">`;
        } else {
            mediaHtml = '';
        }

        // Timer button HTML
        const timerHtml = step.timerMinutes ? `
            <button class="timer-btn" onclick="CookingTimer.start(${step.timerMinutes}, 'Step ${step.step}: ${step.title}')">
                ⏱️ Set Timer (${step.timerMinutes} min)
            </button>
        ` : '';

        return `
            <article class="step-card">
                ${mediaHtml}
                <div class="step-content">
                    <span class="step-number">${step.step}</span>
                    <h3 class="step-title">${step.title}</h3>
                    <p class="step-description">${step.description}</p>
                    ${step.tip ? `
                        <div class="step-tip">
                            <strong>💡 Tip:</strong> ${step.tip}
                        </div>
                    ` : ''}
                    ${timerHtml}
                </div>
            </article>
        `;
    }).join('');
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
    if (!url) return null;

    // Handle different YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Just the ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

// Convert time string (MM:SS or HH:MM:SS) to seconds
function timeToSeconds(timeStr) {
    if (typeof timeStr === 'number') return timeStr;

    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parseInt(timeStr) || 0;
}

function renderRecipe(recipe) {
    if (!recipe) {
        document.body.innerHTML = `
      <div class="empty-state" style="padding: 100px 20px;">
        <div class="empty-state-icon">😕</div>
        <h3 class="empty-state-title">Recipe not found</h3>
        <p>The recipe you're looking for doesn't exist.</p>
        <a href="index.html" class="back-btn" style="margin-top: 20px;">← Back to Recipes</a>
      </div>
    `;
        return;
    }

    renderRecipeHero(recipe);
    renderIngredients(recipe.ingredients);
    renderSteps(recipe.steps, recipe.videoUrl);
    initShoppingButtons(recipe);
}

// ========================================
// Shopping List Integration
// ========================================

function initShoppingButtons(recipe) {
    const addSelectedBtn = document.getElementById('addSelectedBtn');
    const addAllBtn = document.getElementById('addAllBtn');

    if (!addSelectedBtn || !addAllBtn) return;

    // Add Selected - add only checked ingredients
    addSelectedBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.ingredient-checkbox:checked');
        const selected = Array.from(checkboxes).map(cb => {
            return cb.nextElementSibling.textContent.trim();
        });

        if (selected.length === 0) {
            showToast('Select ingredients first');
            return;
        }

        if (typeof ShoppingList !== 'undefined') {
            ShoppingList.addItems(selected, recipe.title);
            showToast(`Added ${selected.length} item${selected.length > 1 ? 's' : ''} to list`);
        }
    });

    // Add All - add all ingredients
    addAllBtn.addEventListener('click', () => {
        if (typeof ShoppingList !== 'undefined') {
            ShoppingList.addItems(recipe.ingredients, recipe.title);
            showToast(`Added ${recipe.ingredients.length} items to list`);
        }
    });
}

// Show toast notification
function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}

// ========================================
// Initialize Recipe Page
// ========================================

async function initRecipePage() {
    const recipeId = getUrlParam('id');

    if (!recipeId) {
        window.location.href = 'index.html';
        return;
    }

    await loadRecipes();
    const recipe = getRecipeById(recipeId);
    renderRecipe(recipe);

    // Initialize share and export
    initShareExport(recipe);
}

// ========================================
// Share & Export Recipe
// ========================================

function initShareExport(recipe) {
    if (!recipe) return;

    // Share button
    const shareBtn = document.getElementById('shareRecipeBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const shareData = {
                title: recipe.title,
                text: `Check out this recipe: ${recipe.title}\n${recipe.description}`,
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: copy link to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    showToast('📋 Link copied to clipboard!');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // Fallback to clipboard
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast('📋 Link copied to clipboard!');
                    } catch {
                        showToast('❌ Could not share');
                    }
                }
            }
        });
    }

    // Export button
    const exportBtn = document.getElementById('exportRecipeBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            // Create clean recipe object for export
            const exportRecipe = { ...recipe };
            delete exportRecipe.isCustom; // Remove internal flag

            const dataStr = JSON.stringify(exportRecipe, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('✅ Recipe exported!');
        });
    }
}

// Run on page load
if (document.getElementById('recipeHero')) {
    initRecipePage();
}
