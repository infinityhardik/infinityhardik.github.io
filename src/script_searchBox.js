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

// Add an event listener to the search box to trigger the scroll when it gains focus
searchBox.addEventListener('focus', () => {
    scrollSearchBoxToTop();
});

searchBox.addEventListener('input', () => {
    scrollSearchBoxToTop();
});

// // Function to clear the search box
function clearSearch() {
    searchBox.value = '';
    filterProducts();
}

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