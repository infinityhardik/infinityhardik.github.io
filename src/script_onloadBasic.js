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

    // Clear existing content
    productListContainer.innerHTML = '';

    productList.forEach(product => {
        const productItem = document.createElement('li');
        productItem.classList.add('align-items-center', 'list-group-item')

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('form-check-input', 'me-2');

        // Generate a unique ID for each checkbox based on the product name
        const checkboxId = `checkbox-${product.Product.replace(/\s/g, '-')}`;
        checkbox.id = checkboxId;
        // checkbox.classList.add('form-check-input', 'me-2');

        const label = document.createElement('label');
        label.classList.add('form-check-label', 'fs-6', 'fw-semibold', 'stretched-link');
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

function openOrderModal(product) {
    resetQuantityToZero(); // Reset quantity to zero when the order modal is opened
    const orderModal = document.getElementById('order-modal');
    const modalProductName = document.getElementById('modal-product-name');

    // Assuming "Products" is the property containing the array of products
    const productDetails = getProductDetails(product);

    // Set product name and additional details in the modal
    modalProductName.textContent = product;
    // document.getElementById('modal-group-name').textContent = `Group Name: ${productDetails['Group Name']}`;
    // document.getElementById('modal-prod-category').textContent = `Product Category: ${productDetails['Prod. Category']}`;
    document.getElementById('modal-product-type').innerHTML = `<b>Product Type :</b> ${productDetails['Product Type']}`;
    document.getElementById('modal-face-type').innerHTML = `<b>Face Type :</b> ${productDetails['Face Type']}`;
    document.getElementById('modal-core-type').innerHTML = `<b>Core Type :</b> ${productDetails['Core Type']}`;
    document.getElementById('modal-grade').innerHTML = `<b>Grade :</b> ${productDetails['Grade']}`;
    document.getElementById('modal-branding').innerHTML = `<b>Branding :</b> ${productDetails['Branding']}`;

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


function toggleProduct(product) {
    const checkbox = document.getElementById(`checkbox-${product.replace(/\s/g, '-')}`);
    const index = selectedProducts.findIndex(item => item.product.Product === product);

    // Toggle the checkbox state
    checkbox.checked = !checkbox.checked;

    // Check the checkbox state and open the modal only if it's checked
    if (checkbox.checked & index === -1) {
        openOrderModal(product);
        resetQuantityToZero(); // Reset quantity to zero when a new product is selected
    } else {
        // Unselecting the product, update the checkbox state
        selectedProducts = selectedProducts.filter(item => item.product.Product !== product);
        updateOrderList();
    }
}