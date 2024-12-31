const searchBox = document.getElementById('search-box');
// Function to scroll to the search box and position it at the top of the screen
function scrollSearchBoxToTop() {
    // Scroll to the search box and position it at the top of the screen
    searchBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// Add an event listener to the search box to trigger the scroll when it gains focus
searchBox.addEventListener('focus', () => {
    scrollSearchBoxToTop();
});

searchBox.addEventListener('input', () => {
    scrollSearchBoxToTop();
})

// Function to clear the search box
function clearSearch() {
    const searchBox = document.getElementById('search-box');
    searchBox.value = '';
    searchProducts();

    // Scroll to the top with smooth transition using scrollIntoView
    document.body.scrollIntoView({ behavior: 'smooth' });
}

// Function to filter products based on search input
function searchProducts() {
    const searchBox = document.getElementById('search-box');
    const filter = searchBox.value.toUpperCase();
    const productList = document.getElementById('product-list');
    const productItems = productList.getElementsByTagName('li');
    let foundMatch = false;

    // First, attempt filtering by Product Name
    for (let i = 0; i < productItems.length; i++) {
        const label = productItems[i].getElementsByTagName('label')[0];
        const productName = label.textContent || label.innerText;

        // Show only products that match the Product Name
        if (containsInOrder(productName, filter)) {
            productItems[i].style.display = '';
            foundMatch = true;
        } else {
            productItems[i].style.display = 'none';
        }
    }

    // If no matches found by Product Name, filter by Brand Name or Core Type
    if (!foundMatch) {
        const productListContainer = Array.from(productItems);
        productListContainer.forEach((item, i) => {
            const productName = item.getElementsByTagName('label')[0].textContent || item.getElementsByTagName('label')[0].innerText;
            const productDetails = getProductDetails(productName);

            const brandName = productDetails['Brand Mark'] ? productDetails['Brand Mark'].toUpperCase() : '';
            const coreType = productDetails['Core Type'] ? productDetails['Core Type'].toUpperCase() : '';
            const gradeType = productDetails['Grade Type'] ? productDetails['Grade Type'].toUpperCase() : '';

            if (containsInOrder(brandName, filter) || containsInOrder(coreType, filter) || containsInOrder(gradeType, filter)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
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
