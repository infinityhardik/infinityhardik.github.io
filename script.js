// Function to send order (replace with your implementation)
function sendOrder() {
    // Sort the selected products by Group Alias name first, then by Product Name
    selectedProducts.sort((a, b) => {
        const groupComparison = a.product['Group Alias'].localeCompare(b.product['Group Alias']);

        if (groupComparison === 0) {
            return a.product.Product.localeCompare(b.product.Product);
        }

        return groupComparison;
    });

    // Generate the order text
    const orderText = selectedProducts.map(item => `${item.product['Product']} - ${item.quantity}`).join('\n');
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
