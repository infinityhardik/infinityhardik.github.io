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
        // Use a more robust regex for quantity validation to ensure only digits
        const quantity = parseInt(quantityStr, 10);
        if (!isNaN(quantity) && quantity >= 0 && /^\d+$/.test(quantityStr)) {
            return {
                searchTerm: potentialSearchTerm.replace(/-/g, ''), // Clean hyphens from search term for better matching
                quantity: quantity,
                isValid: true
            };
        }
    }

    // If no valid quantity found, return just the cleaned search term
    return {
        searchTerm: input.trim().replace(/-/g, ''), // Always clean search term
        quantity: null,
        isValid: false
    };
}

/**
 * Optimized function to check if a string contains another string's characters in the same order (case insensitive).
 * This uses a more efficient character-by-character comparison without creating new strings for each comparison.
 * @param {string} str - The string to search within.
 * @param {string} query - The string to search for.
 * @returns {boolean} True if the query characters are found in order within the string, false otherwise.
 */
function containsInOrder(str, query) {
    const lowerStr = str.toLowerCase();
    const lowerQuery = query.toLowerCase();

    let strIdx = 0;
    let queryIdx = 0;

    while (strIdx < lowerStr.length && queryIdx < lowerQuery.length) {
        if (lowerStr[strIdx] === lowerQuery[queryIdx]) {
            queryIdx++;
        }
        strIdx++;
    }
    return queryIdx === lowerQuery.length;
}

/**
 * Filters the main product directory based on a search term and updates the display.
 * Prioritizes matches by Product Name, then falls back to Brand Mark, Core Type, Grade Type, or Product Type if no matches found.
 * @param {string} filterTerm - The term to filter products by.
 */
function filterProductsAndDisplay(filterTerm = '', options = {}) {
    const normalizedFilter = filterTerm.trim().toUpperCase();
    let filteredProductData = [];

    if (!normalizedFilter) {
        // If no filter term, display all products
        filteredProductData = productsData.productDirectory;
    } else {
        // First, try to match by Product Name only
        filteredProductData = productsData.productDirectory.filter(product => {
            const productName = (product.Product || '').toUpperCase();
            return containsInOrder(productName, normalizedFilter);
        });

        // If no matches by Product Name, try fallback attributes
        if (filteredProductData.length === 0) {
            filteredProductData = productsData.productDirectory.filter(product => {
                const brandMark = (product['Brand Mark'] || '').toUpperCase();
                const coreType = (product['Core Type'] || '').toUpperCase();
                const gradeType = (product['Grade Type'] || '').toUpperCase();
                const productType = (product['Product Type'] || '').toUpperCase();
                return (
                    containsInOrder(brandMark, normalizedFilter) ||
                    containsInOrder(coreType, normalizedFilter) ||
                    containsInOrder(gradeType, normalizedFilter) ||
                    containsInOrder(productType, normalizedFilter)
                );
            });
        }
    }

    // Now, update the UI with the filtered data
    displayProducts(filteredProductData);

    // After filtering and displaying, reset focus to ensure proper navigation behavior
    resetFocus();

    // Ensure search box scrolls to top on every filter
    if (!options.skipScroll) {
        scrollSearchBoxToTop();
    }
}


// Remove the previous static debounce event listener
// searchBox.addEventListener('input', debounce(...));

// Dynamic debounce based on presence of hyphen in search term
let lastDebouncedHandler = null;
let lastDebounceDelay = null;

function dynamicDebounceHandler() {
    const searchInput = searchBox.value;
    const debounceDelay = searchInput.includes('-') ? 1000 : 0;

    // If debounce delay changes, re-attach the event listener
    if (lastDebouncedHandler) {
        searchBox.removeEventListener('input', lastDebouncedHandler);
    }
    const handler = debounce(() => {
        const { searchTerm, quantity, isValid } = parseSearchInput(searchBox.value);
        filterProductsAndDisplay(searchTerm);
        if (isValid && quantity !== null) {
            const firstVisibleProductElement = getFirstVisibleProductElement();
            if (firstVisibleProductElement) {
                const productName = firstVisibleProductElement.dataset.productName;
                addToOrder(productName, quantity);
                searchBox.value = searchTerm;
            }
        }
        if (!isMobileDevice()) {
            focusFirstVisibleItem();
        }
    }, debounceDelay);
    searchBox.addEventListener('input', handler);
    lastDebouncedHandler = handler;
    lastDebounceDelay = debounceDelay;
}

// Attach a watcher to the input for dynamic debounce
searchBox.addEventListener('input', function debounceWatcher() {
    const searchInput = searchBox.value;
    const debounceDelay = searchInput.includes('-') ? 1000 : 0;
    if (debounceDelay !== lastDebounceDelay) {
        dynamicDebounceHandler();
    }
});
// Initialize the correct debounce handler on load
window.addEventListener('DOMContentLoaded', dynamicDebounceHandler);

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

// Function to focus the first visible product item in the list after filtering or clearing
function focusFirstVisibleItem() {
    const productListContainer = document.getElementById("product-list");
    const visibleItems = Array.from(productListContainer.children);
    resetFocus(); // Always clear any previous focus
    if (visibleItems.length > 0) {
        currentFocusIndex = 1;
        visibleItems[0].classList.add("focus");
        visibleItems[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
        currentFocusIndex = -1;
    }
}

// Function to remove focus from all items and reset pointer
function resetFocus() {
    const focusedItems = document.querySelectorAll('.list-group-item.focus');
    focusedItems.forEach(item => {
        item.classList.remove('focus');
    });
    currentFocusIndex = -1;
}

// Ensure pointer is always reset and focused after filtering or clearing
// Patch filterProductsAndDisplay to always call focusFirstVisibleItem
const originalFilterProductsAndDisplay = filterProductsAndDisplay;
filterProductsAndDisplay = function (filterTerm = '') {
    originalFilterProductsAndDisplay(filterTerm);
    if (!isMobileDevice()) {
        focusFirstVisibleItem();
    }
};

// Patch clearSearch to always focus first item
const originalClearSearch = clearSearch;
clearSearch = function () {
    originalClearSearch();
    if (!isMobileDevice()) {
        focusFirstVisibleItem();
    }
};

// Patch clearFilters if it exists
if (typeof clearFilters === 'function') {
    const originalClearFilters = clearFilters;
    clearFilters = function () {
        originalClearFilters();
        if (!isMobileDevice()) {
            focusFirstVisibleItem();
        }
    };
}

// --- Show Selected Only Toggle Logic ---
let showSelectedOnly = false;
const showSelectedOnlyBtn = document.getElementById('showSelectedOnly');
const showSelectedOnlyIcon = document.getElementById('showSelectedOnlyIcon');

if (showSelectedOnlyBtn) {
    showSelectedOnlyBtn.addEventListener('click', function () {
        showSelectedOnly = !showSelectedOnly;
        updateShowSelectedOnlyButton();
        if (showSelectedOnly) {
            searchBox.value = '';
        }
        // Call filterProductsAndDisplay but skip scroll to top
        filterProductsAndDisplay(searchBox.value, { skipScroll: true });
    });
}

function updateShowSelectedOnlyButton() {
    if (showSelectedOnly) {
        showSelectedOnlyBtn.classList.add('active');
        showSelectedOnlyBtn.classList.add('btn-primary');
        showSelectedOnlyIcon.textContent = '✅';
    } else {
        showSelectedOnlyBtn.classList.remove('active');
        showSelectedOnlyBtn.classList.remove('btn-primary');
        showSelectedOnlyIcon.textContent = '🔘';
    }
}

// Patch filterProductsAndDisplay to support showSelectedOnly and skipScroll
const originalFilterProductsAndDisplay2 = filterProductsAndDisplay;
filterProductsAndDisplay = function (filterTerm = '', options = {}) {
    let filteredList;
    if (showSelectedOnly) {
        if (!filterTerm.trim()) {
            filteredList = selectedProducts.map(sel => {
                return productsData.productDirectory.find(p => p.Product === sel.productName);
            }).filter(Boolean);
        } else {
            filteredList = selectedProducts.map(sel => {
                return productsData.productDirectory.find(p => p.Product === sel.productName);
            }).filter(Boolean).filter(product => {
                return product.Product.toUpperCase().includes(filterTerm.trim().toUpperCase());
            });
        }
        displayProducts(filteredList);
        resetFocus();
        if (!options.skipScroll) scrollSearchBoxToTop();
        if (!isMobileDevice()) { focusFirstVisibleItem(); }
    } else {
        originalFilterProductsAndDisplay2(filterTerm);
    }
};

// Only patch updateOrderList if it exists
if (typeof updateOrderList === 'function') {
    const originalUpdateOrderList = updateOrderList;
    updateOrderList = function () {
        originalUpdateOrderList();
        if (showSelectedOnly) {
            filterProductsAndDisplay(searchBox.value);
        }
    };
}
