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
        // Focus put back by a −/+ press (not a new tap on the box): leave the page where it is
        if (searchBox._silentFocus) {
            searchBox._silentFocus = false;
            return;
        }
        if (window.innerWidth > 1023) return;

        if (stickyControls) {
            stickyControls.classList.add('search-active');

            // Bring the search bar to the top on mobile so the focused field
            // stays visible above the keyboard (only if it isn't there already).
            window.clearTimeout(searchBox._mobileFocusScrollTimer);
            searchBox._mobileFocusScrollTimer = window.setTimeout(() => {
                const pinTop = getSearchPinTop();
                if (window.scrollY < pinTop) window.scrollTo({ top: pinTop, behavior: 'smooth' });
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

    // Tapping ✕ must not take focus from the input — that would close the
    // keyboard and clearSearch() would reopen it straight away (a flicker)
    const clearBtn = document.getElementById('clear-search-btn');
    if (clearBtn) clearBtn.addEventListener('mousedown', (e) => e.preventDefault());

    initVirtualKeyboard(searchBox);

    // ── Sticky bar style — only once the bar is actually stuck at the top,
    //    so it doesn't switch back and forth while results change ──
    let _scrollFrame = 0;
    window.addEventListener('scroll', () => {
        if (!stickyControls || _scrollFrame) return;
        _scrollFrame = requestAnimationFrame(() => {
            _scrollFrame = 0;
            stickyControls.classList.toggle('sticky-scrolled', window.scrollY >= getSearchPinTop() - 1);
        });
    }, { passive: true });
});

// ─── On-Screen Keyboard (phones and tablets) ──────────────────────────────────
function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * While the search box is being typed in on a touch screen, html.keyboard-open
 * moves toasts under the search bar (the bottom of the screen is behind the
 * on-screen keyboard). Only follows focus — it never opens or closes the keyboard.
 */
function initVirtualKeyboard(searchBox) {
    const root = document.documentElement;
    searchBox.addEventListener('focus', () => root.classList.toggle('keyboard-open', isTouchDevice()));
    searchBox.addEventListener('blur', () => root.classList.remove('keyboard-open'));
}

// ─── Keep the Search Bar Still While Results Change ───────────────────────────
/**
 * Scroll position at which the search bar sits stuck at the top of the screen
 * (below the header on desktop, at the very top on mobile).
 */
function getSearchPinTop() {
    const list = document.getElementById('product-list');
    const controls = document.querySelector('.sticky-controls');
    if (!list || !controls) return 0;
    const stickyTop = parseFloat(getComputedStyle(controls).top) || 0;
    const listGap = parseFloat(getComputedStyle(list).marginTop) || 0; // space between the bar and the list
    return Math.max(0, list.getBoundingClientRect().top - listGap + window.scrollY - controls.offsetHeight - stickyTop);
}

/**
 * Call right after the list changes. If the user had scrolled the search bar to
 * the top, keep it exactly there and show results from the first one — instead
 * of letting the shorter page snap the scroll position (the "jumping" layout).
 * Runs before the browser paints, so nothing visibly moves.
 */
function keepSearchBarPinned() {
    const pinTop = getSearchPinTop();
    if (window.scrollY > pinTop) window.scrollTo(0, pinTop);
}

/**
 * With the on-screen keyboard open, phones scroll the page by themselves when a
 * −/+ is tapped or the search box text is changed from code: an animated scroll
 * back to where the sticky search bar sits in the page (the top of the list).
 * Hold the page where it is — checked every frame, not only on 'scroll' events,
 * which can arrive too late or not at all while the phone animates its scroll.
 * Lets go at once when the user wheels the page, presses a scroll key or (with
 * releaseOnTouch) touches it: that scroll is theirs.
 *
 * @param {{duration?: number|null, releaseOnTouch?: boolean}} [options]
 *   duration: let go after this many ms (null: only when told to).
 *   releaseOnTouch: false while the hold belongs to a touch that's in progress.
 * @returns {{release: () => void, releaseAfter: (ms: number) => void}}
 */
function holdScrollPosition({ duration = 600, releaseOnTouch = true } = {}) {
    const lockY = window.scrollY;
    let done = false, frame = 0, timer = 0, safety = 0;

    const restore = () => {
        if (!done && Math.abs(window.scrollY - lockY) > 1) window.scrollTo(0, lockY);
    };
    const tick = () => {
        restore();
        if (!done) frame = requestAnimationFrame(tick);
    };
    const onKey = (e) => {
        if (/^(Arrow|Page)|^(Home|End)$/.test(e.key)) release();
    };
    const release = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearTimeout(safety);
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', restore);
        window.removeEventListener('wheel', release);
        window.removeEventListener('touchstart', release);
        window.removeEventListener('keydown', onKey);
    };
    const releaseAfter = (ms) => {
        if (done) return;
        clearTimeout(timer);
        timer = setTimeout(release, ms);
    };

    window.addEventListener('scroll', restore, { passive: true });
    window.addEventListener('wheel', release, { passive: true });
    if (releaseOnTouch) window.addEventListener('touchstart', release, { passive: true });
    window.addEventListener('keydown', onKey);
    frame = requestAnimationFrame(tick);
    if (duration !== null) releaseAfter(duration);
    safety = setTimeout(release, 10000); // never hold on for long

    return { release, releaseAfter };
}

// ─── Search Logic ─────────────────────────────────────────────────────────────
// Both arguments must already be upper-cased
function containsInOrder(s, q) {
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
    // Typing the "-qty" part (or a bare "-") leaves the results as they are, so
    // the list must stay where the user scrolled it — only re-pin when they change
    const termChanged = searchTerm !== currentSearchTerm;
    currentSearchTerm = searchTerm;
    refreshProductList();
    if (termChanged) keepSearchBarPinned();

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
                    // Highlight only — scrolling it into view would jump a scrolled list back to the top
                    updateListFocus(visibleItems, { scroll: false });
                }
            }

            const searchBox = document.getElementById('search-box');
            if (searchBox) {
                holdScrollPosition(); // the phone must not jump back up when "-qty" is cleared
                searchBox.value = searchTerm;
                currentSearchTerm = searchTerm;
            }
        }
    }
}

// Upper-cased search text per product, computed once per product record
const _searchCache = new WeakMap();
function getSearchFields(product) {
    let fields = _searchCache.get(product);
    if (!fields) {
        fields = {
            name: product.Product.toUpperCase(),
            other: ['Brand Mark', 'Core Type', 'Grade Type', 'Product Type', 'Group Name']
                .map(key => (product[key] || '').toUpperCase()),
        };
        _searchCache.set(product, fields);
    }
    return fields;
}

function getFilteredProducts(filterTerm = currentSearchTerm) {
    const normalized = filterTerm.trim().toUpperCase();
    let list = productsData.productDirectory;

    if (showSelectedOnly) {
        list = selectedProducts.map(p => getProductByName(p.productName)).filter(Boolean);
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

    const byName = list.filter(product => containsInOrder(getSearchFields(product).name, normalized));

    if (byName.length > 0) {
        return byName;
    }

    return list.filter(product =>
        getSearchFields(product).other.some(field => containsInOrder(field, normalized))
    );
}

function refreshProductList() {
    displayProducts(getFilteredProducts());
    if (typeof resetFocus === 'function') {
        resetFocus();
    }
}

/**
 * @param {{focus?: boolean}} [options] focus: put the cursor back in the box
 *   (default — the ✕ button, Esc). Clear Order passes false, so it doesn't
 *   pop up the on-screen keyboard.
 */
function clearSearch({ focus = true } = {}) {
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.value = '';
        if (focus) searchBox.focus({ preventScroll: true });
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) clearBtn.classList.remove('is-visible');
    }
    currentSearchTerm = '';
    refreshProductList();
    keepSearchBarPinned();
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
    keepSearchBarPinned();
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
        btn.style.color = 'var(--color-accent)';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
}
