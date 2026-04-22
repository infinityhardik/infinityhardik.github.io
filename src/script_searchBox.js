/**
 * Search Box, Show-Selected-Only, and Mobile Search Pin
 */

// ─── State ────────────────────────────────────────────────────────────────────
let showSelectedOnly = false;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('search-box');
    if (!searchBox) return;

    const stickyControls = searchBox.closest('.sticky-controls');

    // ── Mobile: Highlight sticky header when focused ──
    searchBox.addEventListener('focus', () => {
        if (window.innerWidth > 1023) return;

        if (stickyControls) {
            stickyControls.classList.add('search-active');
            
            // Auto-scroll to top so the search bar is clearly visible
            // Use a slight delay to allow the keyboard to start opening
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    });

    searchBox.addEventListener('blur', () => {
        if (window.innerWidth > 1023) return;
        
        // Small delay to allow clicks on results
        setTimeout(() => {
            if (stickyControls) stickyControls.classList.remove('search-active');
        }, 150);
    });

    // ── Debounced input handling ──
    let _timer = null;
    searchBox.addEventListener('input', () => {
        // Longer delay when hyphen present (quantity shortcut needs to settle)
        const delay = searchBox.value.includes('-') ? 600 : 120;
        clearTimeout(_timer);
        _timer = setTimeout(() => handleSearchInput(searchBox.value), delay);
    });
});

// ─── Search Logic ─────────────────────────────────────────────────────────────
function containsInOrder(str, query) {
    const s = str.toLowerCase(), q = query.toLowerCase();
    let si = 0, qi = 0;
    while (si < s.length && qi < q.length) { if (s[si] === q[qi]) qi++; si++; }
    return qi === q.length;
}

function parseSearchInput(raw) {
    const i = raw.lastIndexOf('-');
    if (i > 0 && i < raw.length - 1) {
        const term = raw.slice(0, i).trim();
        const qty = parseInt(raw.slice(i + 1).trim(), 10);
        if (!isNaN(qty) && qty >= 0) {
            return { searchTerm: term.replace(/-/g, ''), quantity: qty, isValid: true };
        }
    }
    return { searchTerm: raw.trim().replace(/-/g, ''), quantity: null, isValid: false };
}

function handleSearchInput(raw) {
    const { searchTerm, quantity, isValid } = parseSearchInput(raw);
    filterProductsAndDisplay(searchTerm);

    if (isValid && quantity !== null) {
        // Find first visible item and set its quantity
        const first = document.querySelector('#product-list .product-item:not([style*="display: none"]):not([style*="display:none"])');
        if (first && first.dataset.productName) {
            addToOrder(first.dataset.productName, quantity);
            const searchBox = document.getElementById('search-box');
            if (searchBox) searchBox.value = searchTerm;
        }
    }
}

function filterProductsAndDisplay(filterTerm = '', options = {}) {
    let list;

    if (showSelectedOnly) {
        list = selectedProducts
            .map(s => productsData.productDirectory.find(p => p.Product === s.productName))
            .filter(Boolean);
        if (filterTerm) {
            const f = filterTerm.toUpperCase();
            list = list.filter(p => containsInOrder(p.Product.toUpperCase(), f));
        }
    } else {
        const normalized = filterTerm.trim().toUpperCase();
        if (!normalized) {
            list = productsData.productDirectory;
        } else {
            list = productsData.productDirectory.filter(p =>
                containsInOrder(p.Product.toUpperCase(), normalized)
            );
            // Fallback: search product attributes if no name match
            if (list.length === 0) {
                list = productsData.productDirectory.filter(p =>
                    containsInOrder((p['Brand Mark']    || '').toUpperCase(), normalized) ||
                    containsInOrder((p['Core Type']     || '').toUpperCase(), normalized) ||
                    containsInOrder((p['Grade Type']    || '').toUpperCase(), normalized) ||
                    containsInOrder((p['Product Type']  || '').toUpperCase(), normalized)
                );
            }
        }
    }

    displayProducts(list);
}

function clearSearch() {
    const searchBox = document.getElementById('search-box');
    if (searchBox) searchBox.value = '';
    filterProductsAndDisplay('');
}

function getFirstVisibleProductElement() {
    return document.querySelector('#product-list .product-item:not([style*="display: none"]):not([style*="display:none"])') || null;
}

// ─── Show Selected Only ───────────────────────────────────────────────────────
function toggleShowSelectedOnly() {
    showSelectedOnly = !showSelectedOnly;
    updateShowSelectedOnlyButton();
    const searchBox = document.getElementById('search-box');
    if (showSelectedOnly && searchBox) searchBox.value = '';
    filterProductsAndDisplay('', { skipScroll: true });
}

function updateShowSelectedOnlyButton() {
    const btn = document.getElementById('showSelectedOnly');
    if (!btn) return;
    if (showSelectedOnly) {
        btn.style.color = 'var(--color-success)';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="11" fill="currentColor" stroke="none"/>
            <path d="M7 12l3.5 3.5 6.5-6.5" stroke="white" fill="none"/>
        </svg>`;
    } else {
        btn.style.color = 'var(--color-primary)';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
}
