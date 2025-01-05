function sendOrder() {
    // Check if the quantity is greater than zero
    if (selectedProducts.length === 0) {
        console.warn('No products in the order. Please add products to the order.');
        return;
    }

    // Sort the selected products by Group Alias name first, then by Prod. Category, and finally by Product Name
    selectedProducts.sort((a, b) => {
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

    // Generate the order text with new line for each Group Alias change
    let orderText = '';
    let currentGroupAlias = null;

    selectedProducts.forEach(item => {
        const { productGroupAlias, productName, productGroup } = item;

        if (currentGroupAlias !== productGroupAlias) {
            // Insert a new line for a new Group Alias
            orderText += `\n*${productGroup}* :\n`;
            currentGroupAlias = productGroupAlias;
        }

        orderText += `${productName} - ${item.quantity}\n`;
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