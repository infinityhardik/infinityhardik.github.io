// Call loadProducts() when the page loads
window.onload = () => {
    loadProducts();
    applySavedTheme(); // Apply saved theme preference on load
};

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
    const existingItems = Array.from(productListContainer.children);
    const newProductNames = productList.map(p => p.Product);
    const existingMap = new Map();
    existingItems.forEach(li => {
        if (li.dataset.productName) {
            existingMap.set(li.dataset.productName, li);
        }
    });

    // Track which items are still needed
    const used = new Set();

    // Efficiently update or insert items in order
    productList.forEach((product, idx) => {
        const productName = product.Product;
        let item = existingMap.get(productName);
        if (item) {
            // If already in correct position, just update state
            if (productListContainer.children[idx] !== item) {
                productListContainer.insertBefore(item, productListContainer.children[idx] || null);
            }
            // Update checkbox and quantity if needed
            const checkbox = item.querySelector('.product-checkbox');
            const existingProduct = selectedProducts.find(p => p.productName === productName);
            if (checkbox) {
                checkbox.checked = !!existingProduct;
            }
            if (existingProduct) {
                item.classList.add('added-to-order');
            } else {
                item.classList.remove('added-to-order');
            }
            const quantityDisplay = item.querySelector('.quantity-display');
            if (quantityDisplay) {
                quantityDisplay.value = existingProduct ? existingProduct.quantity : 0;
            }
            used.add(productName);
        } else {
            // Create new item (copy from original implementation)
            const productItem = document.createElement('li');
            productItem.classList.add('list-group-item', 'list-group-item-action', 'product-item');
            productItem.dataset.productName = product.Product;
            productItem.dataset.productType = product['Product Type'];
            productItem.dataset.productGroup = product['Group Name'];
            productItem.dataset.productGroupAlias = product['Group Alias'];
            productItem.dataset.productCategory = product['Prod. Category'];
            productItem.dataset.faceType = product['Face Type'] || '';
            productItem.dataset.coreType = product['Core Type'];
            productItem.dataset.gradeType = product['Grade Type'];
            productItem.dataset.brandMark = product['Brand Mark'];

            const checkbox = document.createElement('input');
            checkbox.classList.add('form-check-input', 'product-checkbox');
            checkbox.type = 'checkbox';
            const checkboxId = `checkbox-${product.Product.replace(/\s/g, '-')}`;
            checkbox.id = checkboxId;
            checkbox.title = `Select ${product.Product}`;
            const checkboxLabel = document.createElement('label');
            checkboxLabel.setAttribute('for', checkboxId);
            checkboxLabel.classList.add('visually-hidden');
            checkboxLabel.textContent = `Select ${product.Product}`;
            const existingProduct = selectedProducts.find(p => p.productName === product.Product);
            checkbox.checked = !!existingProduct;
            if (existingProduct) {
                productItem.classList.add('added-to-order');
            }
            checkbox.addEventListener('change', (event) => {
                event.stopPropagation();
                const currentQuantity = existingProduct ? existingProduct.quantity : 0;
                if (checkbox.checked) {
                    if (currentQuantity === 0) {
                        updateProductQuantityInOrder(product.Product, 1);
                    } else {
                        updateProductQuantityInOrder(product.Product, 0);
                    }
                } else {
                    updateProductQuantityInOrder(product.Product, -currentQuantity);
                }
            });
            const productInfoDiv = document.createElement('div');
            productInfoDiv.classList.add('product-info');
            productInfoDiv.onclick = (event) => {
                event.stopPropagation();
                openOrderModal(productItem);
            };
            const productNameSpan = document.createElement('span');
            productNameSpan.classList.add('product-name');
            productNameSpan.textContent = product.Product;
            productNameSpan.setAttribute('title', 'Click to view details');
            const quantityControlsDiv = document.createElement('div');
            quantityControlsDiv.classList.add('quantity-controls');
            const decrementButton = document.createElement('button');
            decrementButton.type = 'button';
            decrementButton.classList.add('btn', 'btn-outline-danger', 'btn-sm', 'qty-btn');
            decrementButton.textContent = '-';
            addHoldListeners(decrementButton, () => updateProductQuantityInOrder(product.Product, -1));
            const quantityDisplayInput = document.createElement('input');
            quantityDisplayInput.type = 'number';
            quantityDisplayInput.classList.add('quantity-display', 'form-control-sm');
            quantityDisplayInput.value = existingProduct ? existingProduct.quantity : 0;
            quantityDisplayInput.readOnly = true;
            quantityDisplayInput.dataset.productName = product.Product;
            quantityDisplayInput.id = `quantity-${product.Product.replace(/\s/g, '-')}`;
            quantityDisplayInput.name = `quantity-${product.Product.replace(/\s/g, '-')}`;
            quantityDisplayInput.title = `Quantity for ${product.Product}`; // Accessibility fix
            const incrementButton = document.createElement('button');
            incrementButton.type = 'button';
            incrementButton.classList.add('btn', 'btn-outline-success', 'btn-sm', 'qty-btn');
            incrementButton.textContent = '+';
            addHoldListeners(incrementButton, () => updateProductQuantityInOrder(product.Product, 1));
            quantityControlsDiv.appendChild(decrementButton);
            quantityControlsDiv.appendChild(quantityDisplayInput);
            quantityControlsDiv.appendChild(incrementButton);
            productInfoDiv.appendChild(checkbox);
            productInfoDiv.appendChild(checkboxLabel);
            productInfoDiv.appendChild(productNameSpan);
            productInfoDiv.setAttribute('aria-labelledby', `${checkboxId} ${productNameSpan.id}`);
            productItem.appendChild(productInfoDiv);
            productItem.appendChild(quantityControlsDiv);
            productItem.addEventListener('click', function (event) {
                if (
                    event.target.closest('.quantity-controls') ||
                    event.target.classList.contains('product-checkbox') ||
                    event.target.tagName === 'BUTTON' ||
                    event.target.tagName === 'INPUT'
                ) {
                    return;
                }
                openOrderModal(productItem);
            });
            productListContainer.insertBefore(productItem, productListContainer.children[idx] || null);
            used.add(productName);
        }
    });
    // Remove any extra items not in the new list
    existingItems.forEach(li => {
        if (!used.has(li.dataset.productName)) {
            productListContainer.removeChild(li);
        }
    });
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
    // Remove any existing feedback message element
    let existingFeedback = document.getElementById('feedback-message');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create new feedback element
    const feedbackElement = document.createElement('div');
    feedbackElement.id = 'feedback-message';
    feedbackElement.classList.add('feedback-message', type);
    feedbackElement.textContent = message;
    document.body.appendChild(feedbackElement);

    // Force a reflow to ensure the animation works
    feedbackElement.offsetHeight;
    
    // Add show class to trigger animation
    feedbackElement.classList.add('show');

    // Remove the element after animation
    setTimeout(() => {
        feedbackElement.classList.remove('show');
        // Wait for fade out animation to complete before removing element
        setTimeout(() => {
            if (feedbackElement && feedbackElement.parentNode) {
                feedbackElement.remove();
            }
        }, 500); // Match this with the CSS transition duration
    }, duration);
}

/**
 * Toggles the visibility of the order text popup from the bottom of the screen.
 */
function toggleOrderPopup() {
    const popup = document.getElementById('order-text-popup');
    const selectedProductsTextarea = document.getElementById('selected-products');
    const floatingOrderButton = document.getElementById('floating-order-button');

    if (popup.classList.contains('show')) {
        popup.classList.remove('show');
        if (floatingOrderButton) floatingOrderButton.style.opacity = '1';
    } else {
        popup.classList.add('show');
        // Ensure textarea content is updated and scrolled to bottom when shown
        updateOrderList();
        selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;
        if (floatingOrderButton) floatingOrderButton.style.opacity = '0.5';
    }
}

/**
 * Toggles dark mode on or off and saves the preference to localStorage.
 */
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    // Save preference to localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    updateDarkModeToggleIcon();
}

/**
 * Applies the saved theme preference from localStorage on page load.
 */
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode'); // Ensure light mode is default if no preference or 'light'
    }
    updateDarkModeToggleIcon();
}

/**
 * Updates the icon of the dark mode toggle button based on the current theme.
 */
function updateDarkModeToggleIcon() {
    const toggleButton = document.getElementById('darkModeToggle');
    if (toggleButton) {
        if (document.body.classList.contains('dark-mode')) {
            toggleButton.innerHTML = '🌙'; // Moon icon for light mode (click to go to dark)
            toggleButton.setAttribute('title', 'Switch to Light Mode');
        } else {
            toggleButton.innerHTML = '🌞'; // Sun icon for dark mode (click to go to light)
            toggleButton.setAttribute('title', 'Switch to Dark Mode');
        }
    }
}

