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
    const heroDescription = document.getElementById('heroDescription');
    const servingsChip = document.getElementById('servingsChip');
    const bookmarkBtn = document.getElementById('bookmarkBtn');

    // Update page title
    document.title = `${recipe.title} | Cookbook`;

    if (heroImage) {
        heroImage.src = recipe.image;
        heroImage.alt = recipe.title;
    }
    if (heroCategory) heroCategory.textContent = recipe.category;
    if (heroTitle) heroTitle.textContent = recipe.title;
    if (heroDescription) heroDescription.textContent = recipe.description || '';

    // Meta chips with icons
    if (heroMeta) {
        heroMeta.innerHTML = `
            <span class="meta-chip">👤 ${recipe.servings} servings</span>
            <span class="meta-chip">⏱️ Prep: ${recipe.prepTime}</span>
            <span class="meta-chip">🔥 Cook: ${recipe.cookTime}</span>
            <span class="meta-chip">📊 ${recipe.difficulty}</span>
        `;
    }

    // Update servings chip
    if (servingsChip) {
        servingsChip.textContent = `👤 ${recipe.servings} serves`;
    }

    // Show edit button for custom recipes
    const editBtn = document.getElementById('editRecipeBtn');
    if (editBtn && recipe.isCustom) {
        editBtn.style.display = 'flex';
        // Remove any existing listeners to prevent duplicates if re-rendered
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);

        newEditBtn.addEventListener('click', () => {
            if (recipe.id) {
                // Ensure ID is treated safely
                const safeId = encodeURIComponent(recipe.id);
                window.location.href = `editor.html?id=${safeId}`;
            } else {
                console.error('Cannot edit recipe: Missing ID', recipe);
                alert('Error: This recipe is missing an ID and cannot be edited.');
            }
        });
    }

    // Bookmark button functionality
    if (bookmarkBtn && typeof Bookmarks !== 'undefined') {
        const isBookmarked = Bookmarks.isBookmarked(recipe.id);
        if (isBookmarked) bookmarkBtn.classList.add('active');

        bookmarkBtn.addEventListener('click', () => {
            const nowBookmarked = Bookmarks.toggle(recipe.id);
            bookmarkBtn.classList.toggle('active', nowBookmarked);
            showToast(nowBookmarked ? '🔖 Saved to bookmarks!' : '❌ Removed from bookmarks');
        });
    }

    // Populate nutrition data - hide if no data exists
    const nutritionCard = document.getElementById('nutritionCard');
    const nutrition = recipe.nutrition;

    if (nutrition && nutritionCard) {
        nutritionCard.style.display = 'flex';
        const nutritionCalories = document.getElementById('nutritionCalories');
        const nutritionCarbs = document.getElementById('nutritionCarbs');
        const nutritionFat = document.getElementById('nutritionFat');
        const nutritionProtein = document.getElementById('nutritionProtein');

        if (nutritionCalories) nutritionCalories.textContent = nutrition.calories || '--';
        if (nutritionCarbs) nutritionCarbs.textContent = nutrition.carbs || '--';
        if (nutritionFat) nutritionFat.textContent = nutrition.fat || '--';
        if (nutritionProtein) nutritionProtein.textContent = nutrition.protein || '--';
    } else if (nutritionCard) {
        nutritionCard.style.display = 'none';
    }

    // Initialize recipe tabs for mobile
    initRecipeTabs();

    // Initialize Cook History
    initCookHistoryUI(recipe);

    // Initialize Collections Dropdown
    initCollectionsDropdown(recipe);

    // Show play button if video exists
    const playBtn = document.getElementById('playVideoBtn');
    if (playBtn && recipe.videoUrl) {
        playBtn.style.display = 'flex';
        initVideoModal(recipe.videoUrl);
    }
}

// ========================================
// Recipe Tabs (Mobile)
// ========================================

function initRecipeTabs() {
    const tabs = document.querySelectorAll('.recipe-tab');
    const ingredientsPanel = document.querySelector('.ingredients-panel');
    const stepsPanel = document.querySelector('.steps-panel');

    if (!tabs.length || !ingredientsPanel || !stepsPanel) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show/hide panels
            const tabName = tab.dataset.tab;
            if (tabName === 'ingredients') {
                ingredientsPanel.removeAttribute('data-hidden');
                stepsPanel.setAttribute('data-hidden', 'true');
            } else {
                ingredientsPanel.setAttribute('data-hidden', 'true');
                stepsPanel.removeAttribute('data-hidden');
            }
        });
    });
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

// ========================================
// Cook History Logic
// ========================================

function initCookHistoryUI(recipe) {
    const cookInfo = document.getElementById('cookInfo');
    const lastCookedDate = document.getElementById('lastCookedDate');
    const markCookedBtn = document.getElementById('markCookedBtn');
    const cookLogSection = document.getElementById('cookLogSection');
    const cookLogList = document.getElementById('cookLogList');

    // Modal elements
    const historyModal = document.getElementById('historyModal');
    const closeHistoryModal = document.getElementById('closeHistoryModal');
    const cancelHistoryBtn = document.getElementById('cancelHistoryBtn');
    const historyForm = document.getElementById('historyForm');
    const historyDateInput = document.getElementById('historyDate');
    const entryIdInput = document.getElementById('entryId');
    const modalTitle = document.getElementById('modalTitle');

    if (!markCookedBtn) return;

    // --- Core UI Update ---
    function updateHistoryUI() {
        const history = CookHistory.get(recipe.id);
        if (history && history.count > 0) {
            if (cookInfo) cookInfo.style.display = 'flex';
            if (cookLogSection) cookLogSection.style.display = 'block';

            // Update counts on all badges
            document.querySelectorAll('#cookCount').forEach(badge => {
                badge.textContent = history.count;
            });

            if (lastCookedDate) {
                lastCookedDate.textContent = CookHistory.formatLastCooked(recipe.id);
            }

            renderCookLog(history.entries);
        } else {
            if (cookInfo) cookInfo.style.display = 'none';
            if (cookLogSection) cookLogSection.style.display = 'none';
            // Also reset badges to 0 if no history
            document.querySelectorAll('#cookCount').forEach(badge => {
                badge.textContent = '0';
            });
        }
    }

    function renderCookLog(entries) {
        if (!cookLogList) return;

        cookLogList.innerHTML = entries.map(entry => `
            <div class="cook-log-item">
                <div class="log-entry-info">
                    <span class="meal-badge ${entry.meal}">${getMealEmoji(entry.meal)} ${entry.meal}</span>
                    <span class="log-date">${CookHistory.formatDate(entry.date)}</span>
                </div>
                <div class="log-actions">
                    <button class="log-btn edit" data-id="${entry.id}" title="Edit entry">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="log-btn delete" data-id="${entry.id}" title="Delete entry">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Action Handlers
        cookLogList.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.id;
                const entry = entries.find(e => e.id === entryId);
                openModal(entry);
            });
        });

        cookLogList.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.id;
                if (confirm('Are you sure you want to delete this cooking entry?')) {
                    CookHistory.deleteEntry(recipe.id, entryId);
                    updateHistoryUI();
                    showToast('🗑️ Entry deleted from history');
                }
            });
        });
    }

    function getMealEmoji(meal) {
        switch (meal) {
            case 'breakfast': return '🌅';
            case 'lunch': return '🥗';
            case 'dinner': return '🍽️';
            case 'snack': return '🥨';
            default: return '🍳';
        }
    }

    // --- Modal Logic ---
    function openModal(entry = null) {
        if (!historyModal) return;

        modalTitle.textContent = entry ? 'Edit Cooking Entry' : 'Add Cooking Entry';
        entryIdInput.value = entry ? entry.id : '';
        historyDateInput.value = entry ? entry.date : new Date().toISOString().split('T')[0];

        // Select meal type
        const mealVal = entry ? entry.meal : 'dinner';
        const radio = historyForm.querySelector(`input[value="${mealVal}"]`);
        if (radio) radio.checked = true;

        historyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        historyModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    markCookedBtn.addEventListener('click', () => openModal());
    closeHistoryModal.addEventListener('click', closeModal);
    cancelHistoryBtn.addEventListener('click', closeModal);

    // Close on click outside modal content
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) closeModal();
    });

    historyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = historyDateInput.value;
        const meal = historyForm.querySelector('input[name="mealType"]:checked').value;
        const entryId = entryIdInput.value;

        if (entryId) {
            CookHistory.updateEntry(recipe.id, entryId, { date, meal });
            showToast('✅ Cooking entry updated');
        } else {
            CookHistory.addEntry(recipe.id, date, meal);
            showToast('👨‍🍳 Great job! Entry added to history');
        }

        closeModal();
        updateHistoryUI();

        // Pulse effect on the button for feedback
        markCookedBtn.classList.add('pulse');
        setTimeout(() => markCookedBtn.classList.remove('pulse'), 500);
    });

    // Initial Render
    updateHistoryUI();
}

// ========================================
// Collections Dropdown Logic
// ========================================

function initCollectionsDropdown(recipe) {
    const dropdown = document.getElementById('collectionDropdown');
    const list = document.getElementById('collectionList');
    const toggleBtn = document.getElementById('addToCollectionBtn');

    if (!dropdown || !list || !toggleBtn) return;

    // Toggle dropdown
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Close on click outside
    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    // Helper to update the main button text
    window.updateCollectionButtonState = () => {
        if (typeof Collections === 'undefined') return;
        const myCollections = Collections.getCollectionsForRecipe(recipe.id);
        const iconSpan = toggleBtn.querySelector('.icon');
        const textSpan = toggleBtn.querySelector('span:not(.icon)');

        if (myCollections.length > 0) {
            toggleBtn.classList.add('active');
            const names = myCollections.map(c => c.name).join(', ');
            if (textSpan) textSpan.textContent = names.length > 15 ? `${names.substring(0, 15)}...` : names;
            if (iconSpan) iconSpan.textContent = myCollections[0].icon || '📁';
        } else {
            toggleBtn.classList.remove('active');
            if (textSpan) textSpan.textContent = 'Add to Collection';
            if (iconSpan) iconSpan.textContent = '📁';
        }
    };

    // Initial state
    window.updateCollectionButtonState();

    // Populate collections
    renderCollectionsList(recipe, list);
}

function renderCollectionsList(recipe, list) {
    const collections = Collections.getAll();
    const sorted = Object.entries(collections).sort((a, b) => a[1].name.localeCompare(b[1].name));

    list.innerHTML = sorted.map(([id, col]) => {
        const isIn = col.recipes.includes(String(recipe.id)) || col.recipes.includes(Number(recipe.id));
        return `
            <button class="dropdown-item ${isIn ? 'active' : ''}" data-id="${id}">
                <span>${col.icon}</span>
                <span>${col.name}</span>
                ${isIn ? '<span style="margin-left:auto">✓</span>' : ''}
            </button>
        `;
    }).join('');

    // Add click handlers
    list.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const collectionId = item.dataset.id;
            const isIn = Collections.isInCollection(collectionId, recipe.id);

            if (isIn) {
                Collections.removeRecipe(collectionId, recipe.id);
                showToast(`Removed from ${Collections.get(collectionId).name}`);
            } else {
                Collections.addRecipe(collectionId, recipe.id);
                showToast(`Added to ${Collections.get(collectionId).name}`);
            }

            // Re-render list
            renderCollectionsList(recipe, list);

            // Update the main button text
            if (window.updateCollectionButtonState) {
                window.updateCollectionButtonState();
            }
        });
    });
}

// ========================================
// Instruction Stepper Logic
// ========================================

const RecipeStepper = {
    isCooking: false,
    cookStartTime: null,
    expectedTime: 0,
    stepTimings: [], // Stores { duration: seconds } for each step
    currentStepStartTime: null,
    timerInterval: null,

    init(recipe) {
        this.steps = recipe.steps;
        this.totalSteps = recipe.steps.length;
        this.videoUrl = recipe.videoUrl;
        this.currentStep = 0;
        this.isCooking = false;
        this.cookStartTime = null;
        this.stepTimings = [];
        this.currentStepStartTime = null;
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Helper to parse "15 min" or "1 hour" to minutes
        const parseTime = (str) => {
            if (!str) return 0;
            const num = parseInt(str);
            if (isNaN(num)) return 0;
            if (str.toLowerCase().includes('hour')) return num * 60;
            return num;
        };
        this.expectedTime = parseTime(recipe.prepTime) + parseTime(recipe.cookTime);

        this.render();
        this.updateUI();
    },

    startCooking() {
        this.isCooking = true;
        this.cookStartTime = Date.now();
        this.currentStepStartTime = Date.now();

        // Start live timer overlay
        this.startLiveTimer();

        this.updateUI();
        showToast('🔥 Cooking session started!');

        // Scroll to first step
        document.getElementById('step-0')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    startLiveTimer() {
        const overlay = document.getElementById('timerOverlay');
        if (!overlay) return;

        overlay.classList.add('active');
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.cookStartTime) / 1000);
            const display = document.getElementById('timerDisplay');
            if (display) {
                const h = Math.floor(elapsed / 3600);
                const m = Math.floor((elapsed % 3600) / 60);
                const s = elapsed % 60;
                display.textContent = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }, 1000);
    },

    render() {
        const list = document.getElementById('stepsList');
        if (!list) return;

        list.innerHTML = `
            <div class="cooking-timer-overlay" id="timerOverlay">
                <div class="dot"></div>
                <span id="timerDisplay">00:00</span>
            </div>
            <div class="stepper-container">
                <div class="start-cooking-section" id="startCookingContainer">
                    <button class="start-cooking-btn" id="startCookingBtn">
                        <span class="icon">👨‍🍳</span> Start Cooking
                    </button>
                </div>
                ${this.steps.map((step, index) => this.generateStepHtml(step, index)).join('')}
                <div id="recipeSummaryLog"></div>
            </div>
            <div class="stepper-floating-controls" id="stepperControls">
                <button class="floating-action-btn secondary icon-only" id="floatingVideoBtn">
                    ▶️
                </button>
                <button class="floating-action-btn primary" id="nextStepBtn" style="display: none;">
                    Next Step
                </button>
            </div>
        `;

        // Bind events
        document.getElementById('nextStepBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('floatingVideoBtn')?.addEventListener('click', () => this.playCurrentStepVideo());
        document.getElementById('startCookingBtn')?.addEventListener('click', () => this.startCooking());

        // Indicator click handles
        document.querySelectorAll('.stepper-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                this.goToStep(index);
            });
        });
    },

    generateStepHtml(step, index) {
        const hasVideo = this.videoUrl && step.startTime !== undefined;
        let mediaHtml = '';

        if (hasVideo) {
            const videoId = extractYouTubeId(this.videoUrl);
            const startSeconds = timeToSeconds(step.startTime);
            const endSeconds = step.endTime ? timeToSeconds(step.endTime) : null;

            let embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startSeconds}`;
            if (endSeconds) embedUrl += `&end=${endSeconds}`;
            embedUrl += '&rel=0&modestbranding=1';

            mediaHtml = `
                <div class="stepper-media-container">
                    <div class="step-video-container">
                        <iframe 
                            class="step-video"
                            src="${embedUrl}"
                            title="Step ${step.step}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                        ></iframe>
                        <div class="step-video-time">
                            <span>📍 ${step.startTime}${step.endTime ? ` - ${step.endTime}` : ''}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (step.image) {
            mediaHtml = `
                <div class="stepper-media-container">
                    <img src="${step.image}" alt="Step ${step.step}" class="stepper-image" loading="lazy">
                </div>
            `;
        }

        const timerHtml = step.timerMinutes ? `
            <button class="timer-btn" onclick="CookingTimer.start(${step.timerMinutes}, 'Step ${step.step}: ${step.title}')">
                ⏱️ Set Timer (${step.timerMinutes} min)
            </button>
        ` : '';

        return `
            <div class="stepper-item" id="step-${index}">
                <div class="stepper-indicator" data-index="${index}">${index + 1}</div>
                <div class="stepper-line">
                    <div class="stepper-line-fill"></div>
                </div>
                <div class="stepper-content">
                    <span class="stepper-label">Step ${index + 1}</span>
                    <h3 class="stepper-title">${step.title}</h3>
                    <p class="stepper-desc">${step.description}</p>
                    ${step.tip ? `
                        <div class="step-tip">
                            <strong>💡 Tip:</strong> ${step.tip}
                        </div>
                    ` : ''}
                    ${timerHtml}
                    ${mediaHtml}
                </div>
            </div>
        `;
    },

    updateUI() {
        const items = document.querySelectorAll('.stepper-item');
        items.forEach((item, index) => {
            item.classList.remove('active', 'completed');
            if (index === this.currentStep) {
                item.classList.add('active');
            } else if (index < this.currentStep) {
                item.classList.add('completed');
            }
        });

        const startBtnContainer = document.getElementById('startCookingContainer');
        const controls = document.getElementById('stepperControls');
        const nextBtn = document.getElementById('nextStepBtn');
        const videoBtn = document.getElementById('floatingVideoBtn');
        const currentStepData = this.steps[this.currentStep];

        if (this.isCooking) {
            if (startBtnContainer) startBtnContainer.style.display = 'none';
            if (controls) controls.classList.add('visible');

            if (nextBtn) {
                nextBtn.style.display = 'flex';
                if (this.currentStep === this.totalSteps - 1) {
                    nextBtn.textContent = 'Finish Cooking! 🎉';
                } else {
                    nextBtn.textContent = 'Next Step';
                }
            }

            if (videoBtn) {
                videoBtn.style.display = (this.videoUrl && currentStepData.startTime !== undefined) ? 'flex' : 'none';
                videoBtn.classList.remove('icon-only');
                videoBtn.innerHTML = '▶️ Video Guide';
            }
        } else {
            if (startBtnContainer) startBtnContainer.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'none';
            if (controls) controls.classList.remove('visible');
            if (videoBtn) videoBtn.style.display = 'none';
        }

        // Auto-scroll to current step if cooking
        if (this.isCooking) {
            const activeItem = document.getElementById(`step-${this.currentStep}`);
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },

    nextStep() {
        // Record duration for current step
        const duration = Math.round((Date.now() - this.currentStepStartTime) / 1000);
        this.stepTimings.push(duration);

        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.currentStepStartTime = Date.now(); // Start timing for next step
            this.updateUI();
        } else {
            this.finishCooking();
        }
    },

    finishCooking() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        document.getElementById('timerOverlay')?.classList.remove('active');

        const cookEndTime = Date.now();
        const totalDurationMs = cookEndTime - this.cookStartTime;
        const totalDurationMin = Math.round(totalDurationMs / 60000);

        // Generate detailed log
        const logContainer = document.getElementById('recipeSummaryLog');
        if (logContainer) {
            let logHtml = `
                <div class="cook-summary-log">
                    <h3 class="stepper-title" style="margin-top: 0;">📊 Cooking Performance Log</h3>
                    <div class="summary-log-item" style="border-bottom: 2px solid var(--color-border); margin-bottom: 8px;">
                        <span class="summary-log-label">Total Time Taken</span>
                        <span class="summary-log-time">${totalDurationMin} minutes</span>
                    </div>
            `;

            this.steps.forEach((step, idx) => {
                const stepSeconds = this.stepTimings[idx] || 0;
                const min = Math.floor(stepSeconds / 60);
                const sec = stepSeconds % 60;
                const timeStr = `${min > 0 ? min + 'm ' : ''}${sec}s`;

                logHtml += `
                    <div class="summary-log-item">
                        <span class="summary-log-label">Step ${idx + 1}: ${step.title.substring(0, 25)}${step.title.length > 25 ? '...' : ''}</span>
                        <span class="summary-log-time">${timeStr}</span>
                    </div>
                `;
            });

            if (this.expectedTime > 0) {
                const diff = totalDurationMin - this.expectedTime;
                const perfMsg = diff < 0 ? `🚀 ${Math.abs(diff)}m faster than estimate!` : (diff > 0 ? `⏱️ ${diff}m over estimate` : `🎯 Exactly on time!`);
                logHtml += `
                    <div class="summary-log-item" style="margin-top: 12px; font-weight: 800; border-top: 1px solid var(--color-border); padding-top: 12px;">
                        <span class="summary-log-label">Performance</span>
                        <span class="summary-log-time" style="color: ${diff <= 0 ? '#27ae60' : '#e67300'}">${perfMsg}</span>
                    </div>
                `;
            }

            logHtml += `</div>`;
            logContainer.innerHTML = logHtml;
            logContainer.scrollIntoView({ behavior: 'smooth' });
        }

        // Integrate with "I Made This" history
        const recipeId = getUrlParam('id');
        if (recipeId && typeof CookHistory !== 'undefined') {
            // Determine meal type based on current hour
            const hour = new Date().getHours();
            let meal = 'dinner';
            if (hour < 11) meal = 'breakfast';
            else if (hour < 16) meal = 'lunch';
            else if (hour < 20) meal = 'dinner';
            else meal = 'snack';

            CookHistory.addEntry(recipeId, new Date().toISOString().split('T')[0], meal);

            // Refresh History UI if function exists
            if (typeof initCookHistoryUI === 'function') {
                // We need the recipe object, but we might not have it here easily
                // However, renderRecipeDetail usually has it. 
                // For simplicity, we just notify and hopefully the UI updates on next page load or we can refresh
                showToast(`✅ Added to "I Made This" history! (${meal})`);

                // Try to find if global recipe object exists to refresh UI
                if (window.currentRecipe) {
                    initCookHistoryUI(window.currentRecipe);
                }
            }
        }

        const nextBtn = document.getElementById('nextStepBtn');
        if (nextBtn) {
            nextBtn.textContent = 'Cooking Complete! 🎉';
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
        }

        showToast('👨‍🍳 Recipe complete! Check your performance log below.');
    },

    goToStep(index) {
        if (index >= 0 && index < this.totalSteps) {
            this.currentStep = index;
            this.updateUI();
        }
    },

    playCurrentStepVideo() {
        const step = this.steps[this.currentStep];
        if (!this.videoUrl || step.startTime === undefined) return;

        const videoId = extractYouTubeId(this.videoUrl);
        const startSeconds = timeToSeconds(step.startTime);

        // Use existing video modal logic
        const modal = document.getElementById('videoModal');
        const playerContainer = document.getElementById('videoModalPlayer');

        if (!modal || !playerContainer) return;

        playerContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSeconds}&rel=0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

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

function renderSteps(recipe) {
    RecipeStepper.init(recipe);
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

    window.currentRecipe = recipe; // Store globally for history refresh
    renderRecipeHero(recipe);
    renderIngredients(recipe.ingredients);
    renderSteps(recipe);
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
if (document.getElementById('heroTitle')) {
    initRecipePage();
}
