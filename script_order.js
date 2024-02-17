let selectedProducts = [];
let productsData;  // Variable to store the products data

// Function to add product to order list with quantity
function addToOrder() {
    const quantityInput = document.getElementById('quantity');
    const product = document.getElementById('modal-product-name').textContent;
    const quantity = parseInt(quantityInput.value, 10);

    if (quantity > 0) {
        selectedProducts.push({ product, quantity });
        updateOrderList();
    } else {
        // If quantity is 0, deselect the product
        // const checkbox = document.querySelector(`#product-list div label:contains('${product}') ~ input`);
        const checkboxes = document.querySelectorAll('#product-list input[type="checkbox"]');
        const checkbox = Array.from(checkboxes).find((cb) => {
            const label = cb.nextElementSibling;
            return label && (label.textContent || label.innerText) === product;
        });

        if (checkbox) {
            checkbox.checked = true;
        }

        checkbox.checked = false;
    }

    closeOrderModal();
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
    const selectedProductsTextarea = document.getElementById('selected-products');
    selectedProductsTextarea.value = selectedProducts.map(item => `${item.product} - ${item.quantity}`).join('\n');

    // Auto-scroll to the bottom
    selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;

}

let currentQuantity = '0';

function appendToQuantity(digit) {
    if (currentQuantity === '0') {
        currentQuantity = digit;
    } else {
        currentQuantity += digit;
    }
    updateQuantityInput();
}

function clearLastDigit() {
    currentQuantity = currentQuantity.slice(0, -1);
    if (currentQuantity === '') {
        currentQuantity = '0';
    }
    updateQuantityInput();
}

// Function to update the order quantity input
function updateQuantityInput() {
    const quantityInput = document.getElementById('quantity');
    quantityInput.value = currentQuantity;
}

// Function to clear all digits and set order quantity to zero
function clearAllDigits() {
    currentQuantity = '0';
    updateQuantityInput();
}

// Function to reset order quantity to zero
function resetQuantityToZero() {
    currentQuantity = '0';
    updateQuantityInput();
}