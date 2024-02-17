let selectedProducts = [];
let productsData;  // Variable to store the products data

// Function to display products
function displayProducts(productList) {
    const productListContainer = document.getElementById('product-list');

    productList.forEach(product => {
        const productItem = document.createElement('div');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        // Generate a unique ID for each checkbox based on the product name
        const checkboxId = `checkbox-${product.Product.replace(/\s/g, '-')}`;
        checkbox.id = checkboxId;

        const label = document.createElement('label');
        label.innerHTML = product.Product;
        label.setAttribute('for', checkboxId); // Associate the label with the checkbox

        productItem.appendChild(checkbox);
        productItem.appendChild(label);
        productItem.onclick = () => toggleProduct(product.Product);


        productListContainer.appendChild(productItem);
    });
}


// Function to load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        productsData = await response.json();
        const productList = productsData.products;
        displayProducts(productList);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Function to get product details from the products.json file
function getProductDetails(productName) {
    if (productsData && productsData.products) {
        const productList = productsData.products;
        const product = productList.find(p => p.Product === productName);
        // console.log(product);
        return product || {};
    }
    return {};
}

// Function to toggle product in the order list
function toggleProduct(product) {
    const index = selectedProducts.findIndex(item => item.product === product);
    if (index === -1) {
        openOrderModal(product);
        resetQuantityToZero(); // Reset quantity to zero when a new product is selected
    } else {
        selectedProducts.splice(index, 1);
        updateOrderList();
    }
}

// Call loadProducts() when the page loads
window.onload = loadProducts;

// Function to clear the search box
function clearSearch() {
    const searchBox = document.getElementById('search-box');
    searchBox.value = '';
    filterProducts();

    // Scroll to the top with smooth transition using scrollIntoView
    document.body.scrollIntoView({ behavior: 'smooth' });
}

// Function to update the order list textarea
function updateOrderList() {
    const selectedProductsTextarea = document.getElementById('selected-products');
    selectedProductsTextarea.value = selectedProducts.map(item => `${item.product} - ${item.quantity}`).join('\n');

    // Auto-scroll to the bottom
    selectedProductsTextarea.scrollTop = selectedProductsTextarea.scrollHeight;

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

// Function to send order (replace with your implementation)
function sendOrder() {
    // Implement logic to send order via WhatsApp
    console.log('Order Sent:', selectedProducts);

    // Sort the selected products by product name
    selectedProducts.sort((a, b) => a.product.localeCompare(b.product));
    
    // Generate the order text
    const orderText = selectedProducts.map(item => `${item.product} - ${item.quantity}`).join('\n');

    // Replace the recipient number with your target WhatsApp number
    const recipientNumber = '+916355360702';

    // Encode the order text for URL
    const encodedOrderText = encodeURIComponent(orderText);

    // Create the wa.me link
    const waMeLink = `https://wa.me/${recipientNumber}?text=${encodedOrderText}`;

    // Open the link in a new tab/window
    window.open(waMeLink, '_blank');
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






// Function to open order modal and set product details
function openOrderModal(product) {
    resetQuantityToZero(); // Reset quantity to zero when the order modal is opened
    const orderModal = document.getElementById('order-modal');
    const modalProductName = document.getElementById('modal-product-name');

    // Assuming "Products" is the property containing the array of products
    const productDetails = getProductDetails(product);

    // Set product name and additional details in the modal
    modalProductName.textContent = product;
    document.getElementById('modal-group-name').textContent = `Thickness = ${productDetails['Group Name']}`;
    document.getElementById('modal-prod-category').textContent = `Size = ${productDetails['Prod. Category']}`;
    document.getElementById('modal-product-type').textContent = `Brand Type = ${productDetails['Product Type']}`;

    orderModal.style.display = 'block';
}


// Function to close order modal
function closeOrderModal(event) {
    const orderModal = document.getElementById('order-modal');
    const quantityInput = document.getElementById('quantity');
    const modalProductName = document.getElementById('modal-product-name').textContent;

    // Check if the event is a key press and if the key is Escape
    if (event && event.type === 'keydown' && event.key === 'Escape') {
        quantityInput.value = '0';
    }

    // Check if quantity is 0, and deselect the product
    if (parseInt(quantityInput.value, 10) === 0) {
        const checkboxes = document.querySelectorAll('#product-list input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            if (label.textContent === modalProductName) {
                checkbox.checked = false;
            }
        });
    }

    orderModal.style.display = 'none';
}

// Add an event listener to the document to capture key presses
document.addEventListener('keydown', closeOrderModal);



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