// Initialize the selectedProducts Array as a Global Variable
let selectedProducts = [];

// Initialize the selectedProductsTextarea Global Variable (now inside the popup)
// This will be initialized when the DOM is ready, after the popup is loaded.
let selectedProductsTextarea;

document.addEventListener('DOMContentLoaded', () => {
    selectedProductsTextarea = document.getElementById('selected-products');
});


/**
 * Updates the quantity of a product in the selectedProducts array and refreshes the UI.
 * This function is called by the +/- buttons on the main product list.
 * @param {string} productName - The name of the product to update.
 * @param {number} change - The amount to change the quantity by (+1, -1, or a specific value if changing to 0).
 */
function updateProductQuantityInOrder(productName, change) {
    let product = productsData.productDirectory.find(p => p.Product === productName);

    if (!product) {
        console.error('Product not found:', productName);
        return;
    }

    // Find the product in selectedProducts
    const existingProductIndex = selectedProducts.findIndex(p => p.productName === productName);
    let currentQuantity = 0;

    if (existingProductIndex > -1) {
        currentQuantity = selectedProducts[existingProductIndex].quantity;
    }

    let newQuantity = currentQuantity + change;

    // Ensure quantity doesn't go below zero
    if (newQuantity < 0) {
        newQuantity = 0;
    }

    // Get references to the UI elements for this product
    const productListItem = document.querySelector(`li[data-product-name="${productName}"]`);
    const quantityDisplay = productListItem ? productListItem.querySelector('.quantity-display') : null;
    const checkbox = productListItem ? productListItem.querySelector('.product-checkbox') : null;

    if (newQuantity > 0) {
        const productObject = {
            productName: product.Product,
            productGroup: product['Group Name'],
            productGroupAlias: product['Group Alias'],
            productCategory: product['Prod. Category'],
            quantity: newQuantity,
        };

        if (existingProductIndex > -1) {
            // Update existing product
            selectedProducts[existingProductIndex] = productObject;
        } else {
            // Add new product
            selectedProducts.push(productObject);
        }
        if (checkbox) checkbox.checked = true;
        if (productListItem) {
            productListItem.classList.remove('removed-from-order');
            productListItem.classList.add('added-to-order');
        }
    } else {
        // Quantity is 0, remove from selectedProducts
        selectedProducts = selectedProducts.filter(p => p.productName !== productName);
        if (checkbox) checkbox.checked = false;
        if (productListItem) {
            productListItem.classList.remove('added-to-order');
            productListItem.classList.add('removed-from-order');
            // Remove the temporary class after animation
            setTimeout(() => {
                productListItem.classList.remove('removed-from-order');
            }, 300); // Match CSS transition duration
        }
    }

    // Update the quantity display on the product list item
    if (quantityDisplay) {
        quantityDisplay.value = newQuantity;
    }

    // Update the main order list textarea (now in the popup)
    updateOrderList();
}


/**
 * Function to add the product with selected quantity (from search bar) to the order.
 * Note: Numeric keypad in modal has been removed. Quantity input is now primarily via +/- buttons or search bar.
 */
function addToOrder(productName, quantity) {
    if (!productName || quantity === undefined) {
        console.error("Product name or quantity is missing for addToOrder.");
        return;
    }

    // Calculate the change needed. If product exists, we need to add the difference to reach `quantity`.
    // If it doesn't exist, the difference will be `quantity`.
    const currentProductInOrder = selectedProducts.find(p => p.productName === productName);
    const currentQuantity = currentProductInOrder ? currentProductInOrder.quantity : 0;
    const change = quantity - currentQuantity;

    updateProductQuantityInOrder(productName, change);
}


/**
 * Clears all selected products from the order and resets the UI.
 */
function clearOrder() {
    selectedProducts = []; // Clear the array

    // Uncheck all checkboxes and reset quantity displays in the product list
    document.querySelectorAll('#product-list .product-item').forEach(item => {
        const checkbox = item.querySelector('.product-checkbox');
        const quantityDisplay = item.querySelector('.quantity-display');
        if (checkbox) checkbox.checked = false;
        if (quantityDisplay) quantityDisplay.value = 0;
        item.classList.remove('added-to-order');
        item.classList.remove('removed-from-order'); // Ensure this is also cleared
    });

    updateOrderList(); // Update the textarea to reflect the empty order
    clearSearch(); // Clear the search box as well
    displayFeedbackMessage('Order cleared successfully!', 'success');
}

/**
 * Updates the content of the order list textarea based on `selectedProducts`.
 */
function updateOrderList() {
    // Ensure the textarea element is available
    if (!selectedProductsTextarea) {
        selectedProductsTextarea = document.getElementById('selected-products');
        if (!selectedProductsTextarea) {
            console.warn("Order textarea not found in DOM.");
            return;
        }
    }

    const sortedProducts = sortProducts(selectedProducts); // Ensure order is always sorted for display
    let orderText = '';
    let currentGroupAlias = null;

    sortedProducts.forEach(item => {
        const { productGroupAlias, productName, productGroup, quantity } = item;
        if (currentGroupAlias !== productGroupAlias) {
            // Insert a new line for a new Group Alias
            orderText += `\n*${productGroup}* :\n`;
            currentGroupAlias = productGroupAlias;
        }
        orderText += `${productName} - ${quantity}\n`;
    });

    let totalQuantity = calculateTotalQuantity();
    orderText += `\nTotal : *${totalQuantity}* Pcs.\n`;

    selectedProductsTextarea.value = orderText.trim(); // Use trim to remove leading/trailing newlines if any

    // Auto-scroll to the bottom for better UX if the popup is open
    const popup = document.getElementById('order-text-popup');
    if (popup && popup.classList.contains('show')) {
        selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;
    }
}

/**
 * Calculates the total quantity of all products in the selected order.
 * @returns {number} The total quantity.
 */
function calculateTotalQuantity() {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0);
}
