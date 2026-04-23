// ─── Order State ──────────────────────────────────────────────────────────────
let selectedProducts = [];
let selectedProductsTextarea;

document.addEventListener('DOMContentLoaded', () => {
    selectedProductsTextarea = document.getElementById('selected-products');
});

// ─── Core Order Logic ─────────────────────────────────────────────────────────

/**
 * Updates the quantity of a product and refreshes the UI.
 * @param {string} productName
 * @param {number} change - delta (+1, -1, or absolute diff)
 */
function updateProductQuantityInOrder(productName, change) {
    const product = productsData.productDirectory.find(p => p.Product === productName);
    if (!product) { console.error('Product not found:', productName); return; }

    const idx = selectedProducts.findIndex(p => p.productName === productName);
    const current = idx > -1 ? selectedProducts[idx].quantity : 0;
    let next = Math.max(0, current + change);

    const li = document.querySelector(`li[data-product-name="${productName}"]`);
    const qd = li ? li.querySelector('.quantity-display') : null;

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
        if (li) {
            li.classList.remove('added-to-order');
        }
    }

    if (qd) qd.value = next;
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
    if (typeof showSelectedOnly !== 'undefined' && showSelectedOnly) {
        showSelectedOnly = false;
        if (typeof updateShowSelectedOnlyButton === 'function') updateShowSelectedOnlyButton();
    }

    updateOrderList();
    if (typeof clearSearch === 'function') clearSearch();
    displayFeedbackMessage('Order cleared.', 'success');
}

// ─── Order Display ────────────────────────────────────────────────────────────

/**
 * Rebuilds the order text and syncs both the mobile textarea and desktop scratchpad.
 */
function updateOrderList() {
    if (!selectedProductsTextarea) {
        selectedProductsTextarea = document.getElementById('selected-products');
    }

    const sorted = (typeof sortProducts === 'function') ? sortProducts(selectedProducts) : selectedProducts;
    let text = '';
    let currentGroup = null;

    sorted.forEach(({ productGroupAlias, productName, productGroup, quantity }) => {
        if (currentGroup !== productGroupAlias) {
            text += `\n*${productGroup}* :\n`;
            currentGroup = productGroupAlias;
        }
        text += `${productName} - ${quantity}\n`;
    });

    if (selectedProducts.length > 0) {
        text += `\nTotal : *${calculateTotalQuantity()}* Pcs.\n`;
    }

    const finalText = text.trim();

    // Keep "Show Selected Only" view in sync when items are added/removed
    if (typeof showSelectedOnly !== 'undefined' && showSelectedOnly &&
        typeof refreshProductList === 'function') {
        refreshProductList();
    }

    // Mobile textarea
    if (selectedProductsTextarea) {
        selectedProductsTextarea.value = finalText || 'Your order will appear here...';
        selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;
    }

    // Desktop scratchpad
    const scratchpad = document.getElementById('scratchpad-content');
    if (scratchpad) {
        if (selectedProducts.length > 0) {
            scratchpad.innerHTML = finalText
                .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        } else {
            scratchpad.innerHTML = '<span class="scratchpad-placeholder">Your order will appear here...</span>';
        }
    }
}

function calculateTotalQuantity() {
    return selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
}
