// Initialize the selectedProducts Array as a Global Variable
let selectedProducts = [];

// Initialize the Quantity Input Global Variable
const quantityInput = document.getElementById('quantity');

// Initialize the selectedProductsTextarea Global Variable
const selectedProductsTextarea = document.getElementById('selected-products');


// Function to append digits to the quantity field
function appendToQuantity(value) {
    const quantityInput = document.getElementById('quantity');
    let currentQuantity = quantityInput.value;

    // Prevent leading zeros, unless the input is "0"
    if (currentQuantity === "0") {
        quantityInput.value = value;
    } else {
        quantityInput.value += value;
    }
}

// Function to clear the last digit of the quantity field
function clearLastDigit() {
    const quantityInput = document.getElementById('quantity');
    let currentQuantity = quantityInput.value;

    // Remove the last digit or reset to 0 if empty
    if (currentQuantity.length > 1) {
        quantityInput.value = currentQuantity.slice(0, -1);
    } else {
        quantityInput.value = '0';
    }
}

// Function to clear all digits in the quantity field
function clearAllDigits() {
    document.getElementById('quantity').value = '0';
}

// Function to add the product with selected quantity to the order
function addToOrder() {

    // Retrieving the Product Details from the Stored Element (openedProductForOrder) Dataset
    const productName = openedProductForOrder.dataset.productName;
    const productGroup = openedProductForOrder.dataset.productGroup;
    const productGroupAlias = openedProductForOrder.dataset.productGroupAlias;
    const productCategory = openedProductForOrder.dataset.productCategory;

    // Validate if the quantity is greater than zero
    const quantity = parseInt(quantityInput.value, 10);

    // Getting the Checkbox ID and checking it out as quantity is 0
    const checkbox = document.getElementById(`checkbox-${productName.replace(/\s/g, '-')}`);

    // Create the product object with quantity and other details required for sorting and grouping
    const product = {
        productName: productName,
        productGroup: productGroup,
        productGroupAlias: productGroupAlias,
        productCategory: productCategory,
        quantity: quantity,
    };

    if (quantity > 0) {
        // Check if the product already exists in the selectedProducts array
        const existingProductIndex = selectedProducts.findIndex(p => p.productName === productName);

        if (existingProductIndex > -1) {
            // Replace the existing product with the new product
            selectedProducts[existingProductIndex] = product;
        } else {
            // Add the new product to the selectedProducts array
            selectedProducts.push(product);
        }

        checkbox.checked = true;

        // Reset the quantity field after adding to the order
        clearAllDigits();

    } else {
        // Remove the product from the selectedProducts array
        selectedProducts = selectedProducts.filter(p => p.productName !== productName);

        checkbox.checked = false;
    }

    // Update the order list
    updateOrderList();

    // Optional: Log the selected products for debugging purposes
    // console.log(selectedProducts);
}

// Function to clear order list
function clearOrder() {
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#product-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    // Clear the order list
    selectedProducts = [];
    updateOrderList();

    // Clear the search box
    clearSearch();
}

// Function to update the order list textarea
function updateOrderList() {
    const productLines = selectedProducts.map(item => `${item.productName} - ${item.quantity}`);
    selectedProductsTextarea.value = productLines.join('\n') + `\nTotal: ${calculateTotalQuantity()}`;

    // Auto-scroll to the bottom
    selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;
}

// Function to calculate the total quantity
function calculateTotalQuantity() {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0);
}