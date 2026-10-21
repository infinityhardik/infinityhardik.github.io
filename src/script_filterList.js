/**
 * Filter System - Vanilla JS
 */
let selectedFilters = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getUniqueValues(data, key) {
    const values = new Set();
    data.forEach(item => { if (item[key]) values.add(String(item[key]).trim()); });
    // numeric: true sorts "6 mm, 9 mm, 12 mm" instead of "12 mm, 6 mm, 9 mm"
    return Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ─── Open Filter Modal ────────────────────────────────────────────────────────
function openFilterModal() {
    populateFilterOptions();
    Modal.open('filter-modal');
}

// ─── Tab Population ───────────────────────────────────────────────────────────
function populateFilterOptions() {
    const listTab = document.getElementById('list-tab');
    const tabContent = document.getElementById('nav-tabContent');
    if (!listTab || !tabContent) return;

    listTab.innerHTML = '';
    tabContent.innerHTML = '';

    const filterKeys = {
        'Product Type': 'Type',
        'Group Name': 'Group',
        'Prod. Category': 'Category',
        'Face Type': 'Face',
        'Core Type': 'Core',
        'Grade Type': 'Grade',
        'Brand Mark': 'Brand',
    };

    let firstBtn = null;

    Object.entries(filterKeys).forEach(([key, label]) => {
        const values = getUniqueValues(productsData.productDirectory, key);
        if (values.length === 0) return;

        // Tab button: category name + how many of its values are picked
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filter-tab-btn';
        btn.dataset.key = key;
        const btnLabel = document.createElement('span');
        btnLabel.textContent = label;
        const btnCount = document.createElement('span');
        btnCount.className = 'filter-tab-count';
        btn.append(btnLabel, btnCount);

        // Pane: one tap-to-toggle chip per value
        const pane = document.createElement('div');
        pane.className = 'filter-tab-pane';
        pane.dataset.key = key;
        pane.style.display = 'none';

        values.forEach(val => {
            const chip = document.createElement('label');
            chip.className = 'filter-chip';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = val;
            cb.dataset.filterKey = key;
            cb.className = 'filter-checkbox';
            cb.checked = !!(selectedFilters[key] && selectedFilters[key].includes(val));

            cb.addEventListener('change', () => {
                if (cb.checked) {
                    if (!selectedFilters[key]) selectedFilters[key] = [];
                    if (!selectedFilters[key].includes(val)) selectedFilters[key].push(val);
                } else {
                    selectedFilters[key] = (selectedFilters[key] || []).filter(v => v !== val);
                    if (selectedFilters[key].length === 0) delete selectedFilters[key];
                }
                updateClearFiltersButtonStyle();
            });

            const text = document.createElement('span');
            text.textContent = val;
            chip.append(cb, text);
            pane.appendChild(chip);
        });

        btn.addEventListener('click', () => {
            // Deactivate all
            listTab.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
            tabContent.querySelectorAll('.filter-tab-pane').forEach(p => p.style.display = 'none');
            // Activate this
            btn.classList.add('active');
            pane.style.display = 'flex'; // chips flow in wrapping rows
        });

        listTab.appendChild(btn);
        tabContent.appendChild(pane);
        if (!firstBtn) firstBtn = btn;
    });

    if (firstBtn) firstBtn.click();
    updateClearFiltersButtonStyle();
}

/** Inside the Filters popup: each tab shows how many of its values are picked. */
function updateFilterModalSummary() {
    document.querySelectorAll('#list-tab .filter-tab-btn').forEach(btn => {
        const n = (selectedFilters[btn.dataset.key] || []).length;
        const badge = btn.querySelector('.filter-tab-count');
        if (badge) badge.textContent = n > 0 ? n : '';
    });
}

// ─── Apply / Clear ────────────────────────────────────────────────────────────
function applyFilters() {
    if (typeof refreshProductList === 'function') refreshProductList();
    if (typeof keepSearchBarPinned === 'function') keepSearchBarPinned();
    Modal.close('filter-modal');

    const count = Object.values(selectedFilters).filter(v => v.length > 0).length;
    if (count > 0) displayFeedbackMessage(`${count} filter(s) applied.`, 'info');
}

function clearFilters() {
    selectedFilters = {};
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    if (typeof refreshProductList === 'function') refreshProductList();
    if (typeof keepSearchBarPinned === 'function') keepSearchBarPinned();
    updateClearFiltersButtonStyle();
    displayFeedbackMessage('Filters cleared.', 'success');
}

function updateClearFiltersButtonStyle() {
    const filterBtn = document.getElementById('filterProductList');
    const clearBtn = document.getElementById('clearFilters');
    const count = Object.values(selectedFilters).reduce((n, v) => n + v.length, 0);

    if (filterBtn) {
        const label = filterBtn.querySelector('.btn-label');
        if (label) label.textContent = count > 0 ? `Filters (${count})` : 'Filters';
    }

    if (clearBtn) clearBtn.classList.toggle('is-hidden', count === 0);

    updateFilterModalSummary();

    const mobileBadge = document.getElementById('mobile-filter-count');
    if (mobileBadge) {
        mobileBadge.textContent = count;
        mobileBadge.classList.toggle('is-visible', count > 0);
        mobileBadge.closest('.mobile-nav-btn').classList.toggle('is-active', count > 0);
    }
}
