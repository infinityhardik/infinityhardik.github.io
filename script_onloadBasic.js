// Function to load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        productsData = await response.json();
        const productList = productsData.productDirectory;
        displayProducts(productList);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

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

// Function to get product details from the products.json file
function getProductDetails(productName) {
    if (productsData && productsData.productDirectory) {
        const productList = productsData.productDirectory;
        const product = productList.find(p => p.Product === productName);
        // console.log(product);
        return product || {};
    }
    return {};
}

// Call loadProducts() when the page loads
window.onload = loadProducts;

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