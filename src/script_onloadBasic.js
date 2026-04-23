// ─── Global State ────────────────────────────────────────────────────────────
let productsData = { productDirectory: [] };
const HOLD_DELAY = 300;
const REPEAT_INTERVAL = 100;

// ─── Bootstrap ───────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    applySavedTheme();
    loadProducts();
});

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadProducts() {
    try {
        const res = await fetch('products.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        productsData = await res.json();

        // Render all items ONCE into the DOM — this is the only time nodes are created
        renderAllProducts();
        updateOrderList();
        updateHistoryBadge();
    } catch (err) {
        console.error('Failed to load products:', err);
        displayFeedbackMessage('Error loading products. Please refresh.', 'error');
    }
}

// ─── One-Time Full Render ─────────────────────────────────────────────────────
/**
 * Creates DOM nodes for every product exactly once.
 * After this, filtering is done by toggling display — no DOM mutations.
 */
function renderAllProducts() {
    const container = document.getElementById('product-list');
    if (!container) return;
    container.innerHTML = '';

    productsData.productDirectory.forEach((product, index) => {
        const name = product.Product;
        const sel = selectedProducts.find(p => p.productName === name);
        const itemId = `product-item-${index}`;

        const item = document.createElement('li');
        item.className = 'product-item';
        item.id = itemId;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.tabIndex = -1; // Managed via keyboard navigation
        item.dataset.productName = name;
        item.dataset.productType      = product['Product Type']    || '';
        item.dataset.productGroup     = product['Group Name']      || '';
        item.dataset.productGroupAlias= product['Group Alias']     || '';
        item.dataset.productCategory  = product['Prod. Category']  || '';
        item.dataset.faceType         = product['Face Type']       || '';
        item.dataset.coreType         = product['Core Type']       || '';
        item.dataset.gradeType        = product['Grade Type']      || '';
        item.dataset.brandMark        = product['Brand Mark']      || '';

        if (sel) {
            item.classList.add('added-to-order');
            item.setAttribute('aria-selected', 'true');
        }

        // ── Product info (click → detail modal) ──
        const info = document.createElement('div');
        info.className = 'product-info';
        info.tabIndex = 0; // Make focusable
        info.setAttribute('role', 'button');
        info.setAttribute('aria-label', `View details for ${name}`);
        
        const openModal = (e) => {
            e.stopPropagation();
            openOrderModal(item);
        };
        
        info.addEventListener('click', openModal);
        info.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(e);
            }
        });

        const nameSpan = document.createElement('span');
        nameSpan.className = 'product-name';
        nameSpan.textContent = name;
        info.appendChild(nameSpan);
        item.appendChild(info);

        // ── Quantity controls ──
        const controls = document.createElement('div');
        controls.className = 'quantity-controls';
        controls.setAttribute('role', 'group');
        controls.setAttribute('aria-label', `Quantity controls for ${name}`);

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'qty-btn btn-outline-danger';
        decBtn.textContent = '−';
        decBtn.setAttribute('aria-label', `Decrease quantity of ${name}`);
        addHoldListeners(decBtn, () => updateProductQuantityInOrder(name, -1));

        const qInput = document.createElement('input');
        qInput.type = 'number';
        qInput.className = 'quantity-display';
        qInput.value = sel ? sel.quantity : 0;
        qInput.readOnly = true;
        qInput.setAttribute('aria-label', `Current quantity of ${name}`);
        qInput.id = `qty-${name.replace(/\s+/g, '-')}`;

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'qty-btn btn-outline-success';
        incBtn.textContent = '+';
        incBtn.setAttribute('aria-label', `Increase quantity of ${name}`);
        addHoldListeners(incBtn, () => updateProductQuantityInOrder(name, 1));

        controls.appendChild(decBtn);
        controls.appendChild(qInput);
        controls.appendChild(incBtn);
        item.appendChild(controls);

        container.appendChild(item);
    });
}

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
    }

    const allItems = Array.from(container.children);
    const visibleSet = new Set(productList.map(p => p.Product));

    allItems.forEach(li => {
        const name = li.dataset.productName;
        const sel = selectedProducts.find(s => s.productName === name);
        li.classList.toggle('hidden', !visibleSet.has(name));
        li.classList.toggle('added-to-order', !!sel);
        li.setAttribute('aria-selected', sel ? 'true' : 'false');

        const qd = li.querySelector('.quantity-display');
        if (qd) qd.value = sel ? sel.quantity : 0;
    });

    const currentVisibleOrder = allItems
        .filter(li => !li.classList.contains('hidden'))
        .map(li => li.dataset.productName);
    const desiredOrder = productList.map(product => product.Product);
    const needsReorder = currentVisibleOrder.length !== desiredOrder.length ||
        currentVisibleOrder.some((name, index) => name !== desiredOrder[index]);

    if (needsReorder) {
        const fragment = document.createDocumentFragment();
        productList.forEach(product => {
            const item = allItems.find(li => li.dataset.productName === product.Product);
            if (item) {
                fragment.appendChild(item);
            }
        });
        container.appendChild(fragment);
    }

    if (typeof syncVisibleProductState === 'function') {
        syncVisibleProductState();
    }
}

// ─── Hold-to-Repeat ───────────────────────────────────────────────────────────
function addHoldListeners(button, action) {
    let timer, interval;

    const start = () => {
        clearTimeout(timer);
        clearInterval(interval);
        button.classList.add('holding');
        action();
        timer = setTimeout(() => { interval = setInterval(action, REPEAT_INTERVAL); }, HOLD_DELAY);
    };
    const stop = () => {
        clearTimeout(timer);
        clearInterval(interval);
        button.classList.remove('holding');
    };

    button.addEventListener('mousedown', (e) => { if (e.button === 0) { e.preventDefault(); start(); } });
    button.addEventListener('mouseup', stop);
    button.addEventListener('mouseleave', stop);
    button.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
    button.addEventListener('touchend', stop);
    button.addEventListener('touchcancel', stop);
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function openOrderModal(productItem) {
    const nameEl = document.getElementById('modal-product-name');
    if (!nameEl) return;
    nameEl.textContent = productItem.dataset.productName;
    document.getElementById('modal-product-type').innerHTML  = `<b>Product Type:</b> ${productItem.dataset.productType}`;
    document.getElementById('modal-face-type').innerHTML     = `<b>Face Type:</b> ${productItem.dataset.faceType}`;
    document.getElementById('modal-core-type').innerHTML     = `<b>Core Type:</b> ${productItem.dataset.coreType}`;
    document.getElementById('modal-grade-type').innerHTML    = `<b>Grade Type:</b> ${productItem.dataset.gradeType}`;
    document.getElementById('modal-brand-mark').innerHTML    = `<b>Brand Mark:</b> ${productItem.dataset.brandMark}`;
    Modal.open('order-modal');
}

// ─── Feedback Toast ───────────────────────────────────────────────────────────
function displayFeedbackMessage(message, type = 'warning', duration = 3000) {
    let el = document.getElementById('feedback-message');
    if (el) el.remove();

    el = document.createElement('div');
    el.id = 'feedback-message';
    el.className = `feedback-message ${type}`;
    el.textContent = message;
    document.body.appendChild(el);

    el.getBoundingClientRect(); // force reflow
    el.style.display = 'block';

    setTimeout(() => {
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
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDarkModeToggleIcon();
}

function applySavedTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    updateDarkModeToggleIcon();
}

function updateDarkModeToggleIcon() {
    const btn = document.getElementById('darkModeToggle');
    if (!btn) return;
    const isDark = document.body.classList.contains('dark-mode');
    btn.innerHTML = isDark ? '🌞' : '🌙';
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}
