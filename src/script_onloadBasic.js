// Call loadProducts() when the page loads
window.onload = loadProducts;

let productsData = { productDirectory: [] }; // Initialize with an empty array to prevent errors
let openedProductForOrder = null; // Stores the product data for the currently opened order modal

// Variables for hold-to-increase/decrease functionality
let holdTimer = null;
let holdInterval = null;
const HOLD_DELAY = 300; // ms before auto-repeat starts
const REPEAT_INTERVAL = 100; // ms for auto-repeat

// Function to load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        productsData = await response.json();

        // Pass the loaded product list data to the displayProducts function
        displayProducts(productsData.productDirectory);

        // Update the order list in case there were previously selected items (e.g., from local storage, if implemented)
        updateOrderList();
    } catch (error) {
        console.error('Error loading products:', error);
        // Optionally display an error message to the user
        // displayFeedbackMessage('Error loading products. Please try again later.', 'error');
    }
}

/**
 * Displays a list of products in the UI, creating interactive elements for each.
 * @param {Array} productList - An array of product objects to display.
 */
function displayProducts(productList) {
    const productListContainer = document.getElementById('product-list');

    // Optimization: Only update if the list has changed in length or order
    if (
        productListContainer.childElementCount === productList.length &&
        Array.from(productListContainer.children).every((li, idx) => li.dataset.productName === productList[idx].Product)
    ) {
        // No change, skip DOM update
        return;
    }

    // Clear existing content to refresh the list
    productListContainer.innerHTML = '';

    // Create a document fragment to improve performance when appending multiple elements
    const fragment = document.createDocumentFragment();

    productList.forEach(product => {
        // Create the list item for the product
        const productItem = document.createElement('li');
        productItem.classList.add('list-group-item', 'list-group-item-action', 'product-item');
        // Attach all product details as data attributes for easy access
        productItem.dataset.productName = product.Product;
        productItem.dataset.productType = product['Product Type'];
        productItem.dataset.productGroup = product['Group Name'];
        productItem.dataset.productGroupAlias = product['Group Alias'];
        productItem.dataset.productCategory = product['Prod. Category'];
        productItem.dataset.faceType = product['Face Type'] || '';
        productItem.dataset.coreType = product['Core Type'];
        productItem.dataset.gradeType = product['Grade Type'];
        productItem.dataset.brandMark = product['Brand Mark'];

        // Create the checkbox for selection
        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input', 'product-checkbox');
        checkbox.type = 'checkbox';
        // Generate a unique ID for each checkbox based on the product name
        const checkboxId = `checkbox-${product.Product.replace(/\s/g, '-')}`;
        checkbox.id = checkboxId;

        // Check if the product is already in the order and update checkbox state
        const existingProduct = selectedProducts.find(p => p.productName === product.Product);
        if (existingProduct) {
            checkbox.checked = true;
            // Add class for visual feedback if already in order
            productItem.classList.add('added-to-order');
        } else {
            checkbox.checked = false;
        }

        // Add event listener for checkbox change
        checkbox.addEventListener('change', (event) => {
            // Prevent modal from opening when clicking checkbox directly
            event.stopPropagation();
            const currentQuantity = existingProduct ? existingProduct.quantity : 0;
            // If checked, add with quantity 1 if not already there, else remove
            if (checkbox.checked) {
                // If product is checked and has 0 quantity, set to 1
                if (currentQuantity === 0) {
                    updateProductQuantityInOrder(product.Product, 1);
                } else {
                    // If already checked and has quantity, no change needed on quantity, just ensure it's in selectedProducts
                    updateProductQuantityInOrder(product.Product, 0); // This just ensures it's in the list
                }
            } else {
                updateProductQuantityInOrder(product.Product, -currentQuantity); // Remove by setting quantity to 0
            }
        });

        // Product information container (clickable to open modal)
        const productInfoDiv = document.createElement('div');
        productInfoDiv.classList.add('product-info');
        // Add click listener to the product info div to open the modal
        productInfoDiv.onclick = (event) => {
            event.stopPropagation(); // Prevent duplicate clicks if parent also has a listener
            openOrderModal(productItem);
        };

        // Product name label
        const productNameSpan = document.createElement('span');
        productNameSpan.classList.add('product-name');
        productNameSpan.textContent = product.Product;
        productNameSpan.setAttribute('title', 'Click to view details'); // Add tooltip


        // Quantity controls container
        const quantityControlsDiv = document.createElement('div');
        quantityControlsDiv.classList.add('quantity-controls');

        // Decrement button
        const decrementButton = document.createElement('button');
        decrementButton.type = 'button';
        decrementButton.classList.add('btn', 'btn-outline-danger', 'btn-sm');
        decrementButton.textContent = '-';
        addHoldListeners(decrementButton, () => updateProductQuantityInOrder(product.Product, -1));


        // Quantity display input
        const quantityDisplayInput = document.createElement('input');
        quantityDisplayInput.type = 'number';
        quantityDisplayInput.classList.add('quantity-display', 'form-control-sm');
        quantityDisplayInput.value = existingProduct ? existingProduct.quantity : 0;
        quantityDisplayInput.readOnly = true; // Make it read-only
        quantityDisplayInput.dataset.productName = product.Product; // Store product name for easy lookup

        // Increment button
        const incrementButton = document.createElement('button');
        incrementButton.type = 'button';
        incrementButton.classList.add('btn', 'btn-outline-success', 'btn-sm');
        incrementButton.textContent = '+';
        addHoldListeners(incrementButton, () => updateProductQuantityInOrder(product.Product, 1));

        // Assemble quantity controls
        quantityControlsDiv.appendChild(decrementButton);
        quantityControlsDiv.appendChild(quantityDisplayInput);
        quantityControlsDiv.appendChild(incrementButton);

        // Assemble product info div
        productInfoDiv.appendChild(checkbox);
        productInfoDiv.appendChild(productNameSpan);

        // Append elements to the product item
        productItem.appendChild(productInfoDiv); // The clickable part for modal
        productItem.appendChild(quantityControlsDiv); // The quantity controls

        fragment.appendChild(productItem);
    });

    // Append the fragment to the container
    productListContainer.appendChild(fragment);
}

/**
 * Adds event listeners for hold functionality to a button.
 * @param {HTMLElement} button - The button element.
 * @param {Function} action - The function to execute on click and during hold.
 */
function addHoldListeners(button, action) {
    let holdTimer;
    let holdInterval;

    const startHold = () => {
        // Clear any existing timers/intervals to prevent overlaps
        clearTimeout(holdTimer);
        clearInterval(holdInterval);

        // Add a class for visual feedback when holding
        button.classList.add('holding');

        // Initial action on press
        action();

        // Start a timer for the initial delay before repeat
        holdTimer = setTimeout(() => {
            // Start repeating the action
            holdInterval = setInterval(action, REPEAT_INTERVAL);
        }, HOLD_DELAY);
    };

    const stopHold = () => {
        clearTimeout(holdTimer);
        clearInterval(holdInterval);
        button.classList.remove('holding'); // Remove holding class
    };

    // Mouse events
    button.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Only for left click
            startHold();
            // Prevent text selection during hold
            e.preventDefault();
        }
    });
    button.addEventListener('mouseup', stopHold);
    button.addEventListener('mouseleave', stopHold);

    // Touch events
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling and default touch behavior
        startHold();
    }, { passive: false }); // Use { passive: false } to allow preventDefault
    button.addEventListener('touchend', stopHold);
    button.addEventListener('touchcancel', stopHold);
}

/**
 * Opens the order modal and populates it with details of the selected product.
 * @param {HTMLElement} productItem - The list item element representing the product.
 */
function openOrderModal(productItem) {
    const modalProductName = document.getElementById('modal-product-name');

    // Set product details in the modal
    modalProductName.textContent = productItem.dataset.productName;

    document.getElementById('modal-product-type').innerHTML = `<b>Product Type :</b> ${productItem.dataset.productType}`;
    document.getElementById('modal-face-type').innerHTML = `<b>Face Type :</b> ${productItem.dataset.faceType}`;
    document.getElementById('modal-core-type').innerHTML = `<b>Core Type :</b> ${productItem.dataset.coreType}`;
    document.getElementById('modal-grade-type').innerHTML = `<b>Grade Type :</b> ${productItem.dataset.gradeType}`;
    document.getElementById('modal-brand-mark').innerHTML = `<b>Brand Mark :</b> ${productItem.dataset.brandMark}`;

    // Store the productItem data for use by the modal (if any actions require it, though keypad is removed)
    openedProductForOrder = productItem;

    // Show the modal
    const orderModal = new bootstrap.Modal(document.getElementById('order-modal'));
    orderModal.show();
}

/**
 * Displays a temporary feedback message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('warning', 'error', 'success').
 * @param {number} duration - How long the message should be displayed in milliseconds.
 */
function displayFeedbackMessage(message, type = 'warning', duration = 3000) {
    let feedbackElement = document.getElementById('feedback-message');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'feedback-message';
        feedbackElement.classList.add('feedback-message');
        document.body.appendChild(feedbackElement);
    }

    feedbackElement.textContent = message;
    feedbackElement.className = 'feedback-message show ' + type; // Reset classes and add new type

    setTimeout(() => {
        feedbackElement.classList.remove('show');
    }, duration);
}

/**
 * Toggles the visibility of the order text popup from the bottom of the screen.
 */
function toggleOrderPopup() {
    const popup = document.getElementById('order-text-popup');
    const selectedProductsTextarea = document.getElementById('selected-products');

    if (popup.classList.contains('show')) {
        popup.classList.remove('show');
    } else {
        popup.classList.add('show');
        // Ensure textarea content is updated and scrolled to bottom when shown
        updateOrderList();
        selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;
    }
}
