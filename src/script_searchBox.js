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
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768);
}

// Add an event listener to the search box to trigger the scroll when it gains focus
searchBox.addEventListener('focus', () => {
    scrollSearchBoxToTop();
});

searchBox.addEventListener('input', () => {
    // Always scroll search box to top
    scrollSearchBoxToTop();

    // Reset focus index on user input
    currentFocusIndex = -1;

    // For desktop browsers, focus the first visible product immediately
    if (!isMobileDevice()) {
        focusFirstVisibleItem();
    }
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

// Modified search box event listener
searchBox.addEventListener('input', debounce(() => {
    const result = parseSearchInput(searchBox.value);
    // console.log('Parse Result:', result);

    // If the search box is empty, just reset everything
    if (!result.searchTerm) {
        resetFocus();
        filterProducts();
        return;
    }

    // Filter products based on the search term
    const foundMatches = filterProducts();

    // If we have a valid quantity and matches were found, process the order
    if (result.isValid && result.quantity !== null && foundMatches) {
        const firstVisibleProduct = getFirstVisibleProduct();
        if (firstVisibleProduct) {
            // Set this product as the opened product for ordering
            openedProductForOrder = firstVisibleProduct;

            // Set the quantity
            document.getElementById('quantity').value = result.quantity.toString();

            // Add to order
            addToOrder();

            // Clear the search box
            searchBox.value = result.searchTerm;

            // Reset the product list display
            filterProducts();
        }
    }
}, 1000)); 
// Update Debounce time in milliseconds for the search box event listener in order to support more digits input

// Function to clear the search box
function clearSearch() {
    searchBox.value = '';
    filterProducts();
    resetFocus();
}

// Function to parse search input with quantity
function parseSearchInput(input) {
    // Find the last occurrence of '-' in case the search term contains hyphens
    const lastHyphenIndex = input.lastIndexOf('-');

    if (lastHyphenIndex !== -1) {
        const searchTerm = input.substring(0, lastHyphenIndex).trim();
        const quantityStr = input.substring(lastHyphenIndex + 1).trim();

        // Enhanced logging for debugging
        // console.log('Search Term:', searchTerm);
        // console.log('Quantity String:', quantityStr);

        // Parse the quantity and verify it's a valid number
        const quantity = parseInt(quantityStr, 10);
        // console.log('Parsed Quantity:', quantity);

        // Only return quantity if it's a valid positive number and the string contains only digits
        if (!isNaN(quantity) && quantity > 0 && /^\d+$/.test(quantityStr)) {
            return {
                searchTerm,
                quantity,
                isValid: true
            };
        }
    }

    // Return just the search term if no valid quantity found
    return {
        searchTerm: input.trim(),
        quantity: null,
        isValid: false
    };
}

// Function to get first visible product
function getFirstVisibleProduct() {
    const productList = document.getElementById('product-list');
    const productItems = Array.from(productList.getElementsByTagName('li'));
    return productItems.find(item => item.style.display !== 'none');
}

// Modified filterProducts function that returns whether matches were found
function filterProducts() {
    const searchInput = searchBox.value;
    const { searchTerm } = parseSearchInput(searchInput);
    const filter = searchTerm.toUpperCase();

    const productList = document.getElementById('product-list');
    const productItems = productList.getElementsByTagName('li');
    let foundMatch = false;

    // First, attempt filtering by Product Name
    for (let i = 0; i < productItems.length; i++) {
        const productName = productItems[i].dataset.productName.toUpperCase();

        if (containsInOrder(productName, filter)) {
            productItems[i].style.display = '';
            foundMatch = true;
        } else {
            productItems[i].style.display = 'none';
        }
    }

    // If no matches found by Product Name, filter by fallback attributes
    if (!foundMatch) {
        for (let i = 0; i < productItems.length; i++) {
            const brandName = productItems[i].dataset.brandMark ? productItems[i].dataset.brandMark.toUpperCase() : '';
            const coreType = productItems[i].dataset.coreType ? productItems[i].dataset.coreType.toUpperCase() : '';
            const gradeType = productItems[i].dataset.gradeType ? productItems[i].dataset.gradeType.toUpperCase() : '';

            if (
                containsInOrder(brandName, filter) ||
                containsInOrder(coreType, filter) ||
                containsInOrder(gradeType, filter)
            ) {
                productItems[i].style.display = '';
                foundMatch = true;
            } else {
                productItems[i].style.display = 'none';
            }
        }
    }

    return foundMatch;
}

// Function to check if a string contains another string in order (case insensitive)
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

// Function to focus the first visible product item
function focusFirstVisibleItem() {
    const productListContainer = document.getElementById("product-list");
    const visibleItems = Array.from(productListContainer.children).filter(
        item => getComputedStyle(item).display !== "none"
    );

    if (visibleItems.length > 0) {
        currentFocusIndex = 1; // Set focus to the first visible item
        visibleItems[0]?.classList.add("focus");
        visibleItems[0]?.scrollIntoView({ block: "nearest" });
    }
}

// Function to reset focus on all items from search results
function resetFocus() {
    const listItems = document.querySelectorAll('.focus'); // Adjust selector as needed
    listItems.forEach(item => {
        item.classList.remove('focus'); // Replace 'focus' with the actual class causing this issue
    });
}