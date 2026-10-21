// ─── Global State ────────────────────────────────────────────────────────────
let productsData = { productDirectory: [] };
const productsByName = new Map();     // Product name → product record
const productRowsByName = new Map();  // Product name → <li> row
const HOLD_DELAY = 300;
const REPEAT_INTERVAL = 100;
// The first visible rows are always fully rendered (.row-eager in style.css),
// so a search never shows on-screen rows at a placeholder height
const EAGER_ROWS = 40;

function getProductByName(name) {
    return productsByName.get(name);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Start downloading products.json the moment this script runs, instead of
// waiting for window 'load' (which waits for every image). Rendering waits for
// DOMContentLoaded so every other script is guaranteed to be loaded.
const productsRequest = fetch('products.json').then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
});
applySavedTheme();
document.addEventListener('DOMContentLoaded', loadProducts);

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadProducts() {
    try {
        productsData = await productsRequest;

        productsByName.clear();
        productsData.productDirectory.forEach(p => productsByName.set(p.Product, p));

        // Render all items ONCE into the DOM — this is the only time nodes are created
        renderAllProducts();
        updateOrderList();
    } catch (err) {
        console.error('Failed to load products:', err);
        displayFeedbackMessage('Error loading products. Please refresh.', 'error');
    }
}

// ─── One-Time Full Render ─────────────────────────────────────────────────────

/**
 * Fills a product name element. Names like "B/B 25 mm 6 x 3" are split into two
 * inline-block parts, so if the name has to wrap it wraps right after "mm".
 * This is pure CSS — no measuring/re-rendering on every search or resize.
 */
function setProductNameContent(nameElement, productName) {
    const match = productName.match(/^(.*?\bmm)\s+(\d.*)$/i);
    if (!match) {
        nameElement.textContent = productName;
        return;
    }
    const primaryLine = document.createElement('span');
    primaryLine.className = 'product-name-line';
    primaryLine.textContent = match[1];

    const secondaryLine = document.createElement('span');
    secondaryLine.className = 'product-name-line product-name-line-secondary';
    secondaryLine.textContent = match[2];

    nameElement.append(primaryLine, ' ', secondaryLine);
}

/**
 * Creates DOM nodes for every product exactly once.
 * After this, filtering is done by toggling display — no DOM mutations.
 * Row interaction uses delegated listeners on the list (see initProductListEvents).
 */
function renderAllProducts() {
    const container = document.getElementById('product-list');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    productRowsByName.clear();

    productsData.productDirectory.forEach((product, index) => {
        const name = product.Product;
        const sel = selectedProducts.find(p => p.productName === name);

        const item = document.createElement('li');
        item.className = 'product-item';
        item.id = `product-item-${index}`;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', sel ? 'true' : 'false');
        // Not focusable: keyboard navigation highlights rows with a class, and a
        // focusable row stole focus from the search box when tapped (closing the
        // on-screen keyboard, which made phones scroll back to the search bar)
        item.dataset.productName = name;
        if (sel) item.classList.add('added-to-order');
        if (index < EAGER_ROWS) item.classList.add('row-eager');

        // ── Product info (click → detail modal) ──
        const info = document.createElement('div');
        info.className = 'product-info';
        info.tabIndex = 0; // Make focusable
        info.setAttribute('role', 'button');
        info.setAttribute('aria-label', `View details for ${name}`);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'product-name';
        setProductNameContent(nameSpan, name);
        info.appendChild(nameSpan);

        // ── Quantity controls ──
        const controls = document.createElement('div');
        controls.className = 'quantity-controls';
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', `Quantity controls for ${name}`);

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'qty-btn btn-outline-danger';
        decBtn.textContent = '−';
        decBtn.dataset.delta = '-1';
        decBtn.setAttribute('aria-label', `Decrease quantity of ${name}`);

        const qInput = document.createElement('input');
        qInput.type = 'number';
        qInput.className = 'quantity-display';
        qInput.value = sel ? sel.quantity : 0;
        qInput.readOnly = true;
        qInput.tabIndex = -1; // display only — the −/+ buttons change it
        qInput.setAttribute('aria-label', `Current quantity of ${name}`);

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'qty-btn btn-outline-success';
        incBtn.textContent = '+';
        incBtn.dataset.delta = '1';
        incBtn.setAttribute('aria-label', `Increase quantity of ${name}`);

        controls.append(decBtn, qInput, incBtn);
        item.append(info, controls);
        item._qtyDisplay = qInput; // saves a querySelector on every update
        fragment.appendChild(item);
        productRowsByName.set(name, item);
    });

    container.textContent = '';
    container.appendChild(fragment);
    if (typeof animateListIntro === 'function') animateListIntro(container);
}

// ─── Delegated Row Events ─────────────────────────────────────────────────────
// One set of listeners on the list instead of ~8 listeners on each of 300+ rows.
function initProductListEvents() {
    const list = document.getElementById('product-list');
    if (!list) return;

    const rowName = (el) => el.closest('.product-item').dataset.productName;

    list.addEventListener('click', (e) => {
        const info = e.target.closest('.product-info');
        if (info) {
            e.stopPropagation();
            openOrderModal(info.closest('.product-item'));
            return;
        }
        // Keyboard activation of +/− (mouse/touch presses are handled on pointerdown)
        const btn = e.target.closest('.qty-btn');
        if (btn && e.detail === 0) {
            updateProductQuantityInOrder(rowName(btn), Number(btn.dataset.delta));
        }
    });

    list.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('product-info')) {
            e.preventDefault();
            e.stopPropagation();
            openOrderModal(e.target.closest('.product-item'));
        }
    });

    // Pressing anywhere on a row except the product name (which opens its
    // details) must not move focus away from the search box
    list.addEventListener('mousedown', (e) => {
        if (e.target.closest('.product-item') && !e.target.closest('.product-info')) e.preventDefault();
    });

    list.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.qty-btn');
        if (!btn || e.button !== 0) return;
        const name = rowName(btn);
        const delta = Number(btn.dataset.delta);
        const action = () => updateProductQuantityInOrder(name, delta);
        // Touch waits to see if it's a tap, a hold or a scroll; a mouse acts at once
        if (e.pointerType === 'touch' || e.pointerType === 'pen') startTouchPress(btn, action, e);
        else startHold(btn, action);
    });

    // While typing a search (keyboard open), a touch on −/+ is ours alone:
    // cancelling touchstart stops the browser treating it as a tap, which on
    // Android, with the keyboard open, scrolled the page back up to the search
    // box on every press. With the keyboard closed there's no such jump, so the
    // touch is left to the browser — a swipe that starts on −/+ (where a right
    // thumb lands) scrolls the list like anywhere else. Tap / hold / swipe are
    // told apart by startTouchPress either way.
    const searchBox = document.getElementById('search-box');
    list.addEventListener('touchstart', (e) => {
        if (e.cancelable && document.activeElement === searchBox && e.target.closest('.qty-btn')) e.preventDefault();
    }, { passive: false });

    // Long-press on −/+ is a hold-to-repeat, not a context menu
    list.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.qty-btn')) e.preventDefault();
    });

    // Tapping/holding −/+ must keep the search box focused, so the on-screen
    // keyboard stays open (as the original touchstart handler did). Cancelling
    // touchend stops the browser's follow-up mouse events that would move focus;
    // a scroll is already the browser's (not cancelable), so scrolling still works.
    list.addEventListener('touchend', (e) => {
        if (e.cancelable && e.target.closest('.product-item') && !e.target.closest('.product-info')) e.preventDefault();
    }, { passive: false });
}

initProductListEvents();

// ─── Filter-Only Display (no DOM mutations) ───────────────────────────────────
/**
 * Shows or hides existing product nodes based on the filtered list.
 * Never creates or removes DOM nodes — only toggles display.
 * This is what eliminates flickering.
 */
function displayProducts(productList) {
    const container = document.getElementById('product-list');
    const noResults = document.getElementById('no-results');
    if (!container) return;

    // Toggle no-results visibility
    if (noResults) {
        noResults.classList.toggle('hidden', productList.length > 0);
        if (productList.length === 0) {
            const emptyOrder = typeof showSelectedOnly !== 'undefined' && showSelectedOnly && selectedProducts.length === 0;
            noResults.querySelector('h3').textContent = emptyOrder ? 'Your order is empty' : 'No products found';
            noResults.querySelector('p').textContent = emptyOrder
                ? 'Add products with the + buttons, then tap the eye icon to see only your order.'
                : "Try adjusting your search or filters to find what you're looking for.";
        }
    }

    container.classList.toggle('is-empty', productList.length === 0);

    const visibleSet = new Set(productList.map(p => p.Product));
    const quantities = new Map(selectedProducts.map(s => [s.productName, s.quantity]));
    const currentVisibleOrder = [];

    // Only touch what changed: unchanged writes still cost style work on 300 rows
    for (const li of container.children) {
        const name = li.dataset.productName;
        const qty = quantities.get(name) || 0;
        const visible = visibleSet.has(name);
        li.classList.toggle('hidden', !visible);
        li.classList.toggle('added-to-order', qty > 0);
        const selected = qty > 0 ? 'true' : 'false';
        if (li.getAttribute('aria-selected') !== selected) li.setAttribute('aria-selected', selected);

        const qd = li._qtyDisplay;
        if (qd && qd.value !== String(qty)) qd.value = qty;

        if (visible) currentVisibleOrder.push(name);
    }

    const needsReorder = currentVisibleOrder.length !== productList.length ||
        productList.some((product, index) => product.Product !== currentVisibleOrder[index]);

    if (needsReorder) {
        const fragment = document.createDocumentFragment();
        productList.forEach(product => {
            const item = productRowsByName.get(product.Product);
            if (item) fragment.appendChild(item);
        });
        container.appendChild(fragment);
    }

    // The first EAGER_ROWS visible rows (in display order) are fully rendered
    let shown = 0;
    for (const li of container.children) {
        const visible = !li.classList.contains('hidden');
        li.classList.toggle('row-eager', visible && shown < EAGER_ROWS);
        if (visible) shown++;
    }

    if (typeof syncVisibleProductState === 'function') {
        syncVisibleProductState();
    }
}

// ─── Hold-to-Repeat ───────────────────────────────────────────────────────────
function startHold(button, action) {
    let interval;

    const stop = () => {
        clearTimeout(timer);
        clearInterval(interval);
        button.classList.remove('holding');
        button.removeEventListener('pointerup', stop);
        button.removeEventListener('pointercancel', stop);
        button.removeEventListener('pointerleave', stop);
    };

    button.classList.add('holding');
    action();
    const timer = setTimeout(() => { interval = setInterval(action, REPEAT_INTERVAL); }, HOLD_DELAY);

    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('pointerleave', stop);
}

/**
 * Touch press on −/+. Nothing happens on touch-down, because the finger may be
 * starting a scroll:
 *  - lifted without moving          → tap: change the quantity once
 *  - held still for TOUCH_HOLD_DELAY → hold: change it, then repeat until lifted
 *  - moved > TOUCH_SLOP px, or the browser takes over to scroll (pointercancel)
 *                                    → scroll: no change
 */
const TOUCH_HOLD_DELAY = 350;
const TOUCH_SLOP = 10;

function startTouchPress(button, action, downEvent) {
    const { pointerId, clientX: startX, clientY: startY } = downEvent;
    let holdTimer = null;
    let repeat = null;
    let fired = false;
    let holding = false;

    // While typing a search, the press must not close the on-screen keyboard:
    // a long press can make the phone take focus from the search box, and the
    // keyboard closing/reopening makes the page jump back to the search bar.
    // If the box loses focus during the press, put it straight back (no scroll).
    const searchBox = document.getElementById('search-box');
    const keepFocus = searchBox && document.activeElement === searchBox;
    const refocus = () => {
        // Browsers ignore focus() inside the blur itself, so do it right after
        const restore = () => {
            if (document.activeElement === searchBox) return;
            searchBox._silentFocus = true; // skip the "bring search bar to top" scroll
            searchBox.focus({ preventScroll: true });
        };
        queueMicrotask(restore);
        requestAnimationFrame(restore);
    };
    if (keepFocus) searchBox.addEventListener('blur', refocus);

    // With the on-screen keyboard open, a phone scrolls the page by itself in
    // reaction to the press (an animated scroll back to the sticky search bar).
    // Hold the page where it was until shortly after the finger lifts — unless
    // the finger itself scrolls (then this is a swipe and the hold lets go).
    // Held on every press: whether the box still has focus at touch-down can't
    // be relied on to tell if the phone is about to do this.
    const hold = holdScrollPosition({ duration: null, releaseOnTouch: false });

    // Once it's a hold (not a scroll), the page must not scroll under the finger
    const noScroll = (e) => { if (holding && e.cancelable) e.preventDefault(); };
    window.addEventListener('touchmove', noScroll, { passive: false });

    const fire = () => {
        fired = true;
        action();
    };

    const cleanup = () => {
        clearTimeout(holdTimer);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('touchmove', noScroll);
        // Let the browser finish the touch before we stop guarding focus and scroll
        if (keepFocus) setTimeout(() => searchBox.removeEventListener('blur', refocus), 300);
        hold.releaseAfter(600);
    };

    const end = () => {
        holding = false;
        clearInterval(repeat);
        button.classList.remove('holding');
        cleanup();
    };

    function onMove(e) {
        if (e.pointerId !== pointerId) return;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > TOUCH_SLOP) {
            hold.release(); // the finger is scrolling: let the page move
            end();
        }
    }
    function onUp(e) {
        if (e.pointerId !== pointerId) return;
        if (!fired) {
            fire(); // a tap
            button.classList.add('holding');
            setTimeout(() => button.classList.remove('holding'), 120);
            cleanup();
            return;
        }
        end();
    }
    function onCancel(e) {
        if (e.pointerId !== pointerId) return;
        hold.release(); // the browser took the touch to scroll
        end();
    }

    holdTimer = setTimeout(() => {
        holding = true;
        button.classList.add('holding');
        fire();
        repeat = setInterval(action, REPEAT_INTERVAL);
    }, TOUCH_HOLD_DELAY);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
// Detail modal rows: element id → products.json column
const PRODUCT_DETAIL_FIELDS = [
    ['modal-product-type', 'Product Type'],
    ['modal-face-type', 'Face Type'],
    ['modal-core-type', 'Core Type'],
    ['modal-grade-type', 'Grade Type'],
    ['modal-brand-mark', 'Brand Mark'],
];

function openOrderModal(productItem) {
    const product = getProductByName(productItem.dataset.productName);
    const nameEl = document.getElementById('modal-product-name');
    if (!nameEl || !product) return;
    nameEl.textContent = product.Product;
    PRODUCT_DETAIL_FIELDS.forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        const label = document.createElement('b');
        label.textContent = `${key}:`;
        el.replaceChildren(label, ` ${product[key] || ''}`);
    });
    Modal.open('order-modal');
    // The detail lines fade up one after another as the popup opens
    if (typeof animateCascade === 'function') {
        animateCascade(document.querySelectorAll('#order-modal .product-meta-list li'), { distance: 8, step: 35, duration: 280 });
    }
}


// ─── Feedback Toast ───────────────────────────────────────────────────────────
function displayFeedbackMessage(message, type = 'warning', duration = 3000) {
    let el = document.getElementById('feedback-message');
    if (el) el.remove();

    el = document.createElement('div');
    el.id = 'feedback-message';
    el.className = `feedback-message ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status'); // read out by screen readers
    el.textContent = message;
    // On-screen keyboard open: the bottom of the screen is hidden, so show the
    // toast just under the search bar instead
    if (document.documentElement.classList.contains('keyboard-open')) {
        const bar = document.querySelector('.search-container');
        if (bar) el.style.top = `${Math.max(8, Math.round(bar.getBoundingClientRect().bottom + 8))}px`;
    }
    el.style.display = 'block';
    document.body.appendChild(el);
    if (typeof animateToastIn === 'function') animateToastIn(el); // slide up + fade in, no forced reflow

    setTimeout(() => {
        if (!el.parentNode) return; // already replaced by a newer toast
        if (typeof animateToastOut === 'function' && animateToastOut(el)) return;
        el.style.opacity = '0';
        setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
    }, duration);
}

// ─── Mobile Order Popup ───────────────────────────────────────────────────────
function toggleOrderPopup() {
    const popup = document.getElementById('order-text-popup');
    if (!popup) return;
    if (popup.classList.contains('active')) {
        Modal.close('order-text-popup');
    } else {
        if (typeof updateOrderList === 'function') updateOrderList();
        Modal.open('order-text-popup');
    }
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
// The class lives on <html> so the inline script in <head> can set it before first paint.
// localStorage can throw (private browsing, site data blocked): the theme then
// just isn't remembered — it must never stop the rest of the page loading.
function toggleDarkMode() {
    const applyTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) { /* not remembered */ }
        updateDarkModeToggleIcon();
    };
    if (typeof animateThemeSwitch === 'function') animateThemeSwitch(document.getElementById('darkModeToggle'), applyTheme);
    else applyTheme();
}

function applySavedTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* use the light theme */ }
    document.documentElement.classList.toggle('dark-mode', saved === 'dark');
    updateDarkModeToggleIcon();
}

function updateDarkModeToggleIcon() {
    const btn = document.getElementById('darkModeToggle');
    if (!btn) return;
    // The moon/sun icons are both in the markup; CSS shows the right one
    const isDark = document.documentElement.classList.contains('dark-mode');
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    btn.setAttribute('aria-label', btn.title);
}
