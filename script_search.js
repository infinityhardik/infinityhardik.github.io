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
    filterProducts();

    // Scroll to the top with smooth transition using scrollIntoView
    document.body.scrollIntoView({ behavior: 'smooth' });
}

// Function to filter products based on search input
function filterProducts() {
    const searchBox = document.getElementById('search-box');
    const filter = searchBox.value.toUpperCase();
    const productList = document.getElementById('product-list');
    const productItems = productList.getElementsByTagName('div');

    for (let i = 0; i < productItems.length; i++) {
        const label = productItems[i].getElementsByTagName('label')[0];
        const productName = label.textContent || label.innerText;

        if (containsInOrder(productName, filter)) {
            productItems[i].style.display = '';
        } else {
            productItems[i].style.display = 'none';
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
