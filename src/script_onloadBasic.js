// Call loadProducts() when the page loads
window.onload = loadProducts();

let productsData;

// Function to load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        productsData = await response.json();

        // One-Time Access to the productsData
        const productList = productsData.productDirectory;

        // Passing the Product List Data to displayProducts function
        displayProducts(productList);

    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(productList) {
    const productListContainer = document.getElementById('product-list');

    // Clear existing content
    productListContainer.innerHTML = '';

    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();

    productList.forEach(product => {
        const productItem = document.createElement('li');
        productItem.classList.add('list-group-item', 'list-group-item-action');
        productItem.setAttribute('data-bs-toggle', "modal");
        productItem.setAttribute('data-bs-target', "#order-modal");

        // Attach product details as data attributes
        productItem.dataset.productName = product.Product;
        productItem.dataset.productType = product['Product Type'];
        productItem.dataset.productGroup = product['Group Name'];
        productItem.dataset.productGroup = product['Group Alias'];
        productItem.dataset.productCategory = product['Prod. Category'];
        productItem.dataset.faceType = product['Face Type'];
        productItem.dataset.coreType = product['Core Type'];
        productItem.dataset.gradeType = product['Grade Type'];
        productItem.dataset.brandMark = product['Brand Mark'];
        productItem.dataset.quantityInput = 0; // Set Default Value for Quantity Input of User

        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input', 'me-2');
        checkbox.type = 'checkbox';

        // Generate a unique ID for each checkbox based on the product name
        const checkboxId = `checkbox-${product.Product.replace(/\s/g, '-')}`;
        checkbox.id = checkboxId;
        checkbox.value = checkboxId;

        const label = document.createElement('label');
        label.classList.add('form-check-label', 'fs-6', 'fw-semibold', 'stretched-link');
        label.textContent = product.Product;
        label.setAttribute('for', checkboxId); // Associate the label with the checkbox

        const badge = document.createElement('span');
        badge.classList.add('badge', 'bg-success', 'ms-auto');
        if(productItem.dataset.quantityInput != 0) {
            badge.innerHTML = productItem.dataset.quantityInput
        }

        productItem.appendChild(checkbox);
        productItem.appendChild(label);
        productItem.appendChild(badge);

        // Add event listener to open modal with product data
        productItem.onclick = () => openOrderModal(productItem);

        fragment.appendChild(productItem);
    });

    // Append the fragment to the container
    productListContainer.appendChild(fragment);
}

function openOrderModal(productItem) {
    const modalProductName = document.getElementById('modal-product-name');

    // Set product details in the modal
    modalProductName.textContent = productItem.dataset.productName;

    // document.getElementById('modal-group-name').textContent = `<b>Group Name: </b>${productItem.dataset.productGroup}`;
    // document.getElementById('modal-prod-category').textContent = `<b>Product Category: </b>${productItem.dataset.productCategory}`;
    document.getElementById('modal-product-type').innerHTML = `<b>Product Type :</b> ${productItem.dataset.productType}`;
    document.getElementById('modal-face-type').innerHTML = `<b>Face Type :</b> ${productItem.dataset.faceType}`;
    document.getElementById('modal-core-type').innerHTML = `<b>Core Type :</b> ${productItem.dataset.coreType}`;
    document.getElementById('modal-grade-type').innerHTML = `<b>Grade Type :</b> ${productItem.dataset.gradeType}`;
    document.getElementById('modal-brand-mark').innerHTML = `<b>Brand Mark :</b> ${productItem.dataset.brandMark}`;

}