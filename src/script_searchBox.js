/**
 * Search Box, Show-Selected-Only, and Mobile Search Pin
 */

// ─── State ────────────────────────────────────────────────────────────────────
let showSelectedOnly = false;
let currentSearchTerm = '';

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

            // Bring the sticky action/search controls to the top on mobile
            // so the focused search field stays visible above the keyboard.
            window.clearTimeout(searchBox._mobileFocusScrollTimer);
            searchBox._mobileFocusScrollTimer = window.setTimeout(() => {
                const rect = stickyControls.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetTop = Math.max(0, scrollTop + rect.top);
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            }, 300);
        }
    });

    searchBox.addEventListener('blur', () => {
        if (window.innerWidth > 1023) return;
        
        // Small delay to allow clicks on results
        setTimeout(() => {
            if (stickyControls) stickyControls.classList.remove('search-active');
        }, 150);

        window.clearTimeout(searchBox._mobileFocusScrollTimer);
    });

    // ── Debounced input handling ──
    let _timer = null;
    searchBox.addEventListener('input', () => {
        // Toggle clear button visibility via CSS class (prevents layout shift)
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) {
            clearBtn.classList.toggle('is-visible', !!searchBox.value);
        }

        // Longer delay when hyphen present (quantity shortcut needs to settle)
        const delay = searchBox.value.includes('-') ? 600 : 120;
        clearTimeout(_timer);
        _timer = setTimeout(() => handleSearchInput(searchBox.value), delay);
    });

    // ── Sticky Header Shadow on Scroll ──
    window.addEventListener('scroll', () => {
        if (stickyControls) {
            stickyControls.classList.toggle('sticky-scrolled', window.scrollY > 10);
        }
    }, { passive: true });
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
    currentSearchTerm = searchTerm;
    refreshProductList();

    if (isValid && quantity !== null) {
        // Find first visible item using the .hidden class (matches how displayProducts works)
        const first = getFirstVisibleProductElement();
        if (first && first.dataset.productName) {
            addToOrder(first.dataset.productName, quantity);

            // Sync keyboard-navigation focus to the first visible item
            if (typeof currentFocusIndex !== 'undefined' && typeof updateListFocus === 'function') {
                const productList = document.getElementById('product-list');
                if (productList) {
                    // Guard: only consider actual product rows (excludes #no-results and any other sibling elements)
                    const visibleItems = Array.from(productList.children).filter(
                        li => li.classList.contains('product-item') && !li.classList.contains('hidden')
                    );
                    currentFocusIndex = 0;
                    updateListFocus(visibleItems);
                }
            }

            const searchBox = document.getElementById('search-box');
            if (searchBox) {
                searchBox.value = searchTerm;
                currentSearchTerm = searchTerm;
            }
        }
    }
}

function getFilteredProducts(filterTerm = currentSearchTerm) {
    const normalized = filterTerm.trim().toUpperCase();
    let list = productsData.productDirectory;

    if (showSelectedOnly) {
        list = selectedProducts
            .map(selectedProduct =>
                productsData.productDirectory.find(product => product.Product === selectedProduct.productName)
            )
            .filter(Boolean);
    }

    if (typeof selectedFilters !== 'undefined' && Object.keys(selectedFilters).length > 0) {
        list = list.filter(product =>
            Object.entries(selectedFilters).every(([key, values]) =>
                values.length === 0 || values.includes(String(product[key] || '').trim())
            )
        );
    }

    if (!normalized) {
        return list;
    }

    const byName = list.filter(product =>
        containsInOrder(product.Product.toUpperCase(), normalized)
    );

    if (byName.length > 0) {
        return byName;
    }

    return list.filter(product =>
        containsInOrder((product['Brand Mark'] || '').toUpperCase(), normalized) ||
        containsInOrder((product['Core Type'] || '').toUpperCase(), normalized) ||
        containsInOrder((product['Grade Type'] || '').toUpperCase(), normalized) ||
        containsInOrder((product['Product Type'] || '').toUpperCase(), normalized) ||
        containsInOrder((product['Group Name'] || '').toUpperCase(), normalized)
    );
}

function refreshProductList() {
    displayProducts(getFilteredProducts());
    if (typeof resetFocus === 'function') {
        resetFocus();
    }
}

function clearSearch() {
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.value = '';
        searchBox.focus();
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) clearBtn.classList.remove('is-visible');
    }
    currentSearchTerm = '';
    refreshProductList();
    if (typeof resetFocus === 'function') resetFocus();
}

function getFirstVisibleProductElement() {
    return document.querySelector('#product-list .product-item:not(.hidden)') || null;
}

// ─── Show Selected Only ───────────────────────────────────────────────────────
function toggleShowSelectedOnly() {
    showSelectedOnly = !showSelectedOnly;
    updateShowSelectedOnlyButton();
    const searchBox = document.getElementById('search-box');
    if (showSelectedOnly && searchBox) searchBox.value = '';
    if (showSelectedOnly) currentSearchTerm = '';
    refreshProductList();
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
