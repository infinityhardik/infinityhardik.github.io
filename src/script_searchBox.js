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
    scrollSearchBoxToTop();

    // Reset focus index on user input
    currentFocusIndex = -1;

    // Filter products based on user input
    filterProducts();

    // For desktop browsers, focus the first visible product
    if (!isMobileDevice()) {
        focusFirstVisibleItem();
    }
});

// Function to clear the search box
function clearSearch() {
    searchBox.value = '';
    filterProducts();
}

// Function to filter products based on search input
function filterProducts() {
    const filter = searchBox.value.toUpperCase();
    const productList = document.getElementById('product-list');
    const productItems = productList.getElementsByTagName('li');
    let foundMatch = false;

    // First, attempt filtering by Product Name
    for (let i = 0; i < productItems.length; i++) {
        const productName = productItems[i].dataset.productName.toUpperCase();

        // Show or hide based on Product Name match
        if (containsInOrder(productName, filter)) {
            productItems[i].style.display = ''; // Show
            foundMatch = true;
        } else {
            productItems[i].style.display = 'none'; // Hide
        }
    }

    // If no matches found by Product Name, filter by fallback attributes
    if (!foundMatch) {
        for (let i = 0; i < productItems.length; i++) {
            const brandName = productItems[i].dataset.brandMark ? productItems[i].dataset.brandMark.toUpperCase() : '';
            const coreType = productItems[i].dataset.coreType ? productItems[i].dataset.coreType.toUpperCase() : '';
            const gradeType = productItems[i].dataset.gradeType ? productItems[i].dataset.gradeType.toUpperCase() : '';

            // Show or hide based on fallback attributes
            if (
                containsInOrder(brandName, filter) ||
                containsInOrder(coreType, filter) ||
                containsInOrder(gradeType, filter)
            ) {
                productItems[i].style.display = ''; // Show
            } else {
                productItems[i].style.display = 'none'; // Hide
            }
        }
    }
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