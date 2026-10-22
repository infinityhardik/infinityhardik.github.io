// ─── Order State ──────────────────────────────────────────────────────────────
let selectedProducts = [];
let _lastOrderItemCount = 0; // for the "item added" pulse
let _lastOrderHtml = null;   // order panels' current HTML

// ─── Core Order Logic ─────────────────────────────────────────────────────────

/**
 * Updates the quantity of a product and refreshes the UI.
 * @param {string} productName
 * @param {number} change - delta (+1, -1, or absolute diff)
 */
function updateProductQuantityInOrder(productName, change) {
    const product = getProductByName(productName);
    if (!product) { console.error('Product not found:', productName); return; }

    const idx = selectedProducts.findIndex(p => p.productName === productName);
    const current = idx > -1 ? selectedProducts[idx].quantity : 0;
    let next = Math.max(0, current + change);

    const li = productRowsByName.get(productName);
    const qd = li ? li._qtyDisplay : null;

    if (next > 0) {
        const obj = {
            productName: product.Product,
            productGroup: product['Group Name'],
            productGroupAlias: product['Group Alias'],
            productCategory: product['Prod. Category'],
            quantity: next,
        };
        if (idx > -1) selectedProducts[idx] = obj;
        else selectedProducts.push(obj);
        if (li) li.classList.add('added-to-order');
    } else {
        selectedProducts = selectedProducts.filter(p => p.productName !== productName);
        if (li) li.classList.remove('added-to-order');
    }

    if (qd) {
        qd.value = next;
        // Pop the number so each tap is confirmed, even mid-scroll
        if (next !== current) animateBump(qd);
    }
    updateOrderList();
}

/**
 * Sets a product to a specific absolute quantity.
 */
function addToOrder(productName, quantity) {
    if (!productName || quantity === undefined) return;
    const current = (selectedProducts.find(p => p.productName === productName) || {}).quantity || 0;
    updateProductQuantityInOrder(productName, quantity - current);
}

/**
 * Clears all selected products and resets UI.
 */
function clearOrder(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    selectedProducts = [];

    document.querySelectorAll('#product-list .product-item').forEach(item => {
        const qd = item.querySelector('.quantity-display');
        if (qd) qd.value = 0;
        item.classList.remove('added-to-order');
    });

    // Reset show-selected-only if active
    if (showSelectedOnly) {
        showSelectedOnly = false;
        updateShowSelectedOnlyButton();
    }

    updateOrderList();
    clearSearch({ focus: false });
    displayFeedbackMessage('Order cleared.', 'success');
}

// ─── Order Display ────────────────────────────────────────────────────────────

/**
 * Rebuilds the order text and syncs both the mobile order sheet and desktop scratchpad.
 */
function updateOrderList() {
    // Keep "Show Selected Only" view in sync when items are added/removed
    if (showSelectedOnly) refreshProductList();

    // Mobile bottom-nav item count
    const orderBadge = document.getElementById('mobile-order-count');
    if (orderBadge) {
        orderBadge.textContent = selectedProducts.length;
        orderBadge.classList.toggle('is-visible', selectedProducts.length > 0);
        orderBadge.closest('.mobile-nav-btn').classList.toggle('has-items', selectedProducts.length > 0);
    }

    // A new product in the order: pulse the count badge once (phones/tablets) —
    // quantity changes on existing items don't pulse. The first item makes the
    // badge appear, so it springs in instead.
    if (selectedProducts.length > _lastOrderItemCount) {
        if (_lastOrderItemCount === 0) animatePopIn(orderBadge);
        else animateBump(orderBadge, 1.35, 300);
    }
    _lastOrderItemCount = selectedProducts.length;

    // Desktop scratchpad and mobile order sheet show the same formatted text
    // (WhatsApp *bold* markers rendered as bold)
    const orderHtml = selectedProducts.length > 0
        ? orderTextToHtml(formatOrderText(sortProducts(selectedProducts))).replace(/\n/g, '<br>')
        : '<span class="scratchpad-placeholder">Your order will appear here...</span>';
    // Rebuilding the HTML re-lays out both panels — skip it when nothing changed
    // (e.g. a hold on − at 0, or the same quantity typed again)
    if (orderHtml === _lastOrderHtml) return;
    _lastOrderHtml = orderHtml;
    ['scratchpad-content', 'selected-products'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = orderHtml;
    });
}

// ─── HTML Helpers ─────────────────────────────────────────────────────────────

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Order text as HTML: escaped, with WhatsApp *bold* markers shown as bold. */
function orderTextToHtml(text) {
    return escapeHtml(text).replace(/\*(.*?)\*/g, '<strong>$1</strong>');
}
