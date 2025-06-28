const searchBox = document.getElementById('search-box');

// Function to scroll to the search box and position it at the top of the screen with margin
function scrollSearchBoxToTop() {
    const offset = 15; // Margin from the top of the screen
    const elementPosition = searchBox.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Function to determine if the current device is a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|IPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
}

// Add an event listener to the search box to trigger the scroll when it gains focus
searchBox.addEventListener('focus', () => {
    scrollSearchBoxToTop();
});

// Debounce function to prevent rapid firing of events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Parses the search input to extract a search term and an optional quantity.
 * Expected format: "searchTerm-quantity" (e.g., "MRX9036-10")
 * @param {string} input - The full string from the search box.
 * @returns {{searchTerm: string, quantity: number|null, isValid: boolean}} An object containing the parsed search term, quantity, and a validity flag.
 */
function parseSearchInput(input) {
    const lastHyphenIndex = input.lastIndexOf('-');

    if (lastHyphenIndex !== -1 && lastHyphenIndex < input.length - 1) {
        const potentialSearchTerm = input.substring(0, lastHyphenIndex).trim();
        const quantityStr = input.substring(lastHyphenIndex + 1).trim();

        // Check if the part after hyphen is a valid positive integer
        const quantity = parseInt(quantityStr, 10);
        if (!isNaN(quantity) && quantity >= 0 && /^\d+$/.test(quantityStr)) {
            return {
                searchTerm: potentialSearchTerm.replace(/-/g, ''), // Clean hyphens from search term
                quantity: quantity,
                isValid: true
            };
        }
    }

    // If no valid quantity found, return just the cleaned search term
    return {
        searchTerm: input.trim().replace(/-/g, ''),
        quantity: null,
        isValid: false
    };
}

/**
 * Checks if a string contains another string's characters in the same order (case insensitive).
 * @param {string} str - The string to search within.
 * @param {string} query - The string to search for.
 * @returns {boolean} True if the query characters are found in order within the string, false otherwise.
 */
function containsInOrder(str, query) {
    str = str.toUpperCase();
    query = query.toUpperCase();

    let index = 0;
    for (let i = 0; i < query.length; i++) {
        index = str.indexOf(query[i], index);
        if (index === -1) {
            return false;
        }
        index++;
    }
    return true;
}

/**
 * Filters the main product directory based on a search term and updates the display.
 * It searches by product name, brand mark, core type, grade type, or product type.
 * This function now filters the `productsData.productDirectory` array directly
 * and then calls `displayProducts` to update the DOM efficiently.
 * @param {string} filterTerm - The term to filter products by.
 */
function filterProductsAndDisplay(filterTerm = '') {
    const filter = filterTerm.toUpperCase();
    let filteredProductData = [];

    if (!filter) {
        // If no filter term, display all products
        filteredProductData = productsData.productDirectory;
    } else {
        // Filter the actual data array, not the DOM elements
        filteredProductData = productsData.productDirectory.filter(product => {
            const productName = (product.Product || '').toUpperCase();
            const brandMark = (product['Brand Mark'] || '').toUpperCase();
            const coreType = (product['Core Type'] || '').toUpperCase();
            const gradeType = (product['Grade Type'] || '').toUpperCase();
            const productType = (product['Product Type'] || '').toUpperCase();

            return (
                containsInOrder(productName, filter) ||
                containsInOrder(brandMark, filter) ||
                containsInOrder(coreType, filter) ||
                containsInOrder(gradeType, filter) ||
                containsInOrder(productType, filter)
            );
        });
    }

    // Now, update the UI with the filtered data
    displayProducts(filteredProductData);

    // After filtering and displaying, reset focus to ensure proper navigation behavior
    resetFocus();

    // Ensure search box scrolls to top on every filter
    scrollSearchBoxToTop();
}


// Modified search box event listener with debounce for input
searchBox.addEventListener('input', debounce(() => {
    const searchInput = searchBox.value;
    const { searchTerm, quantity, isValid } = parseSearchInput(searchInput);

    // Always filter and display based on the current search term
    filterProductsAndDisplay(searchTerm);

    // If a valid quantity is provided in the search input and a product is visible after filtering
    if (isValid && quantity !== null) {
        // Get the first visible product element *after* filtering and display update
        const firstVisibleProductElement = getFirstVisibleProductElement();
        if (firstVisibleProductElement) {
            const productName = firstVisibleProductElement.dataset.productName;
            addToOrder(productName, quantity);

            // Keep only the search term in the search box after processing quantity
            // This will re-trigger the input event and thus filterProductsAndDisplay
            // but debounce will prevent excessive calls.
            searchBox.value = searchTerm;
        }
    }

    // For desktop browsers, focus the first visible product immediately if not on mobile
    if (!isMobileDevice()) {
        focusFirstVisibleItem();
    }
}, 1000)); // Debounce time in milliseconds for the search box event listener


// Function to clear the search box and reset the product list
function clearSearch() {
    searchBox.value = '';
    filterProductsAndDisplay(''); // Show all products by passing an empty filter term
    resetFocus();
}

/**
 * Gets the first currently visible product list item element.
 * @returns {HTMLElement|null} The first visible product list item, or null if none are visible.
 */
function getFirstVisibleProductElement() {
    const productList = document.getElementById('product-list');
    if (!productList) return null;

    // After `displayProducts` is called, `productList.children` will only contain the visible items.
    // So, we just need to check the first child.
    if (productList.children.length > 0) {
        return productList.children[0];
    }
    return null;
}

/**
 * Focuses on the first visible product item in the list.
 */
function focusFirstVisibleItem() {
    const productListContainer = document.getElementById("product-list");
    // After `filterProductsAndDisplay` updates the DOM, `productListContainer.children`
    // will only contain the filtered (visible) items.
    const visibleItems = Array.from(productListContainer.children);

    resetFocus(); // Clear any existing focus

    if (visibleItems.length > 0) {
        currentFocusIndex = 1; // Set focus index for the first visible item
        visibleItems[0].classList.add("focus");
        visibleItems[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

/**
 * Removes the 'focus' class from all list items.
 */
function resetFocus() {
    const focusedItems = document.querySelectorAll('.list-group-item.focus');
    focusedItems.forEach(item => {
        item.classList.remove('focus');
    });
    currentFocusIndex = -1; // Reset focus index
}
