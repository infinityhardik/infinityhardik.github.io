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