// Function to send order (replace with your implementation)
function sendOrder() {

    // Check if the quantity is greater than zero
    if (parseInt(currentQuantity, 10) === 0 || selectedProducts.length === 0) {
        console.warn('Quantity is zero or no products in the order. Please add products to the order.');
        return;
    }

    // Sort the selected products by Group Alias name first, then by Product Name
    selectedProducts.sort((a, b) => {
        const groupComparison = a.product['Group Alias'].localeCompare(b.product['Group Alias']);

        if (groupComparison === 0) {
            return a.product.Product.localeCompare(b.product.Product);
        }

        return groupComparison;
    });

    // Generate the order text with new line for each Group Alias change
    let orderText = '';
    let currentGroupAlias = null;

    selectedProducts.forEach(item => {
        const { 'Group Alias': groupAlias, Product, 'Group Name': groupName } = item.product;

        if (currentGroupAlias !== groupAlias) {
            // Insert a new line for a new Group Alias
            orderText += `\n*${groupName}* :\n`;
            currentGroupAlias = groupAlias;
        }

        orderText += `${Product} - ${item.quantity}\n`;
    });

    let totalQuantity = calculateTotalQuantity();
    orderText += `\nTotal : *${totalQuantity}* Pcs.\n`;
    // console.log(orderText);

    // Replace the recipient number with your target WhatsApp number
    const recipientNumber = '+916355360702';

    // Encode the order text for URL
    const encodedOrderText = encodeURIComponent(orderText);

    // Create the wa.me link
    const waMeLink = `https://wa.me/${recipientNumber}?text=${encodedOrderText}`;

    // Open the link in a new tab/window
    window.open(waMeLink, '_blank');
}

// Function to calculate the total quantity
function calculateTotalQuantity() {
    return selectedProducts.reduce((total, item) => total + item.quantity, 0);
}