// Function to check if there are products in the order
function hasProducts(selectedProducts) {
    if (selectedProducts.length === 0) {
        console.warn('No products in the order. Please add products to the order.');
        return false;
    }
    return true;
}

// Sort the selected products by Group Alias name first, then by Prod. Category, and finally by Product Name
// Function to sort products by Group Alias, Product Category, and Product Name
function sortProducts(selectedProducts) {
    return selectedProducts.sort((a, b) => {
        const groupComparison = a.productGroupAlias.localeCompare(b.productGroupAlias);

        if (groupComparison === 0) {
            const categoryComparison = a.productCategory.localeCompare(b.productCategory);

            if (categoryComparison === 0) {
                return a.productName.localeCompare(b.productName);
            }

            return categoryComparison;
        }

        return groupComparison;
    });
}

// Function to generate the order text
// Generate the order text with new line for each Group Alias change
function generateOrderText(sortedProducts) {
    let orderText = '';
    let currentGroupAlias = null;

    sortedProducts.forEach(item => {
        const { productGroupAlias, productName, productGroup, quantity } = item;
        if (currentGroupAlias !== productGroupAlias) {
            // Insert a new line for a new Group Alias
            orderText += `\n*${productGroup}* :\n`;
            currentGroupAlias = productGroupAlias;
        }
        orderText += `${productName} - ${quantity}\n`;
    });

    let totalQuantity = calculateTotalQuantity();
    orderText += `\nTotal : *${totalQuantity}* Pcs.\n`;
    return orderText;
}

// Function to send the order via WhatsApp
function sendOrder() {
    if (!hasProducts(selectedProducts)) return;

    const sortedProducts = sortProducts(selectedProducts);
    const orderText = generateOrderText(sortedProducts);

    const recipientNumber = '+916355360702'; // Replace with your target WhatsApp number
    const encodedOrderText = encodeURIComponent(orderText);

    // Create the wa.me link
    const waMeLink = `https://wa.me/${recipientNumber}?text=${encodedOrderText}`;

    // Open the link in a new tab/window
    window.open(waMeLink, '_blank');
}

// Function to copy the order text to the clipboard
function copyOrder() {
    if (!hasProducts(selectedProducts)) return;

    const sortedProducts = sortProducts(selectedProducts);
    const orderText = generateOrderText(sortedProducts);

    navigator.clipboard.writeText(orderText);
}