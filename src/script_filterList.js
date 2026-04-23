/**
 * Filter System - Vanilla JS
 */
let selectedFilters = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getUniqueValues(data, key) {
    const values = new Set();
    data.forEach(item => { if (item[key]) values.add(String(item[key]).trim()); });
    return Array.from(values).sort();
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

        // Tab button
        const btn = document.createElement('button');
        btn.className = 'filter-tab-btn';
        btn.textContent = label;
        btn.dataset.key = key;

        // Pane
        const pane = document.createElement('div');
        pane.className = 'filter-tab-pane';
        pane.dataset.key = key;
        pane.style.display = 'none';

        values.forEach(val => {
            const row = document.createElement('label');
            row.className = 'filter-check-row';

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

            row.appendChild(cb);
            row.appendChild(document.createTextNode(' ' + val));
            pane.appendChild(row);
        });

        btn.addEventListener('click', () => {
            // Deactivate all
            listTab.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
            tabContent.querySelectorAll('.filter-tab-pane').forEach(p => p.style.display = 'none');
            // Activate this
            btn.classList.add('active');
            pane.style.display = 'block';
        });

        listTab.appendChild(btn);
        tabContent.appendChild(pane);
        if (!firstBtn) firstBtn = btn;
    });

    if (firstBtn) firstBtn.click();
    updateClearFiltersButtonStyle();
}

// ─── Apply / Clear ────────────────────────────────────────────────────────────
function applyFilters() {
    if (typeof refreshProductList === 'function') refreshProductList();
    Modal.close('filter-modal');

    const count = Object.values(selectedFilters).filter(v => v.length > 0).length;
    if (count > 0) displayFeedbackMessage(`${count} filter(s) applied.`, 'info');
}

function clearFilters() {
    selectedFilters = {};
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    if (typeof refreshProductList === 'function') refreshProductList();
    updateClearFiltersButtonStyle();
    displayFeedbackMessage('Filters cleared.', 'success');
}

function updateClearFiltersButtonStyle() {
    const filterBtn = document.getElementById('filterProductList');
    const clearBtn = document.getElementById('clearFilters');
    const count = Object.values(selectedFilters).reduce((n, v) => n + v.length, 0);

    if (filterBtn) {
        filterBtn.innerHTML = count > 0
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filters (${count})`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filters`;
    }

    if (clearBtn) clearBtn.classList.toggle('is-hidden', count === 0);
}
