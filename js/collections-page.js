/**
 * Collections Management Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initCollectionsPage();
});

function initCollectionsPage() {
    const form = document.getElementById('addCollectionForm');
    const grid = document.getElementById('collectionsGrid');

    if (!form || !grid) return;

    // Load and render collections
    renderCollections();

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('collectionName');
        const iconInput = document.getElementById('collectionIcon');

        const name = nameInput.value.trim();
        const icon = iconInput.value.trim() || '📁';

        if (name) {
            const result = Collections.create(name, icon);
            if (result.success) {
                nameInput.value = '';
                iconInput.value = '';
                renderCollections();
                showToast(`✅ Created collection "${name}"`);
            } else {
                showToast(`❌ ${result.error}`);
            }
        }
    });
}

function renderCollections() {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;

    const collections = Collections.getAll();
    const sorted = Object.entries(collections).sort((a, b) => a[1].name.localeCompare(b[1].name));

    if (sorted.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No collections found. Create your first one above!</p>';
        return;
    }

    grid.innerHTML = sorted.map(([id, col]) => {
        const recipeCount = col.recipes.length;
        // Defaults shouldn't be deleted? Or maybe they can be.
        // Let's allow deleting everything except maybe a system one if we had it.

        return `
            <div class="collection-manage-card">
                <div class="collection-manage-icon">${col.icon}</div>
                <div class="collection-manage-info">
                    <h3 class="collection-manage-name">${col.name}</h3>
                    <p class="collection-manage-count">${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}</p>
                </div>
                <div class="collection-manage-actions">
                    <button class="delete-collection-btn" data-id="${id}" title="Delete collection">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add delete handlers
    grid.querySelectorAll('.delete-collection-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const collections = Collections.getAll();
            const col = collections[id];

            if (confirm(`Are you sure you want to delete the "${col.name}" collection? Recipes will not be deleted, only removed from this collection.`)) {
                Collections.delete(id);
                renderCollections();
                showToast('✅ Collection deleted');
            }
        });
    });
}

// Reuse toast from app.js if available, or define local one
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2500);
}
