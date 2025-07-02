/**
 * Checks if there are any products currently selected in the order.
 * @param {Array<Object>} selectedProducts - The array of currently selected products.
 * @returns {boolean} True if products exist in the order, false otherwise.
 */
function hasProducts(selectedProducts) {
    if (selectedProducts.length === 0) {
        displayFeedbackMessage('No products in the order. Please add products.', 'warning');
        return false;
    }
    return true;
}

/**
 * Sorts the selected products based on Group Alias, Product Category, and Product Name.
 * @param {Array<Object>} selectedProducts - The array of products to sort.
 * @returns {Array<Object>} A new array containing the sorted products.
 */
function sortProducts(selectedProducts) {
    // Create a shallow copy to avoid modifying the original array directly if it's referenced elsewhere
    return [...selectedProducts].sort((a, b) => {
        // Primary sort: by productGroupAlias
        const groupComparison = a.productGroupAlias.localeCompare(b.productGroupAlias);

        if (groupComparison === 0) {
            // Secondary sort: if group aliases are same, sort by productCategory
            const categoryComparison = a.productCategory.localeCompare(b.productCategory);

            if (categoryComparison === 0) {
                // Tertiary sort: if categories are same, sort by productName
                return a.productName.localeCompare(b.productName);
            }

            return categoryComparison;
        }

        return groupComparison;
    });
}

/**
 * Copies the current order text to the clipboard.
 */
function copyOrder() {
    if (!hasProducts(selectedProducts)) {
        return;
    }

    const sortedProducts = sortProducts(selectedProducts);
    const orderText = formatOrderText(sortedProducts);

    // Use the modern Clipboard API if available, fallback to execCommand for older browsers/environments
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(orderText)
            .then(() => {
                displayFeedbackMessage('Order copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy order text: ', err);
                displayFeedbackMessage('Failed to copy order. Please try again.', 'error');
            });
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = orderText;
        textarea.style.position = 'fixed'; // Avoid scrolling to bottom
        textarea.style.opacity = '0'; // Hide it
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                displayFeedbackMessage('Order copied to clipboard (fallback)!', 'success');
            } else {
                throw new Error('execCommand failed');
            }
        } catch (err) {
            console.error('Fallback: Failed to copy order text: ', err);
            displayFeedbackMessage('Failed to copy order. Please try manually.', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Sends the current order via WhatsApp.
 */
function sendOrder() {
    if (!hasProducts(selectedProducts)) {
        return;
    }

    const sortedProducts = sortProducts(selectedProducts);
    const orderText = encodeURIComponent(formatOrderText(sortedProducts)); // Encode for URL

    const recipientNumber = '+916355360702'; // Replace with your target WhatsApp number

    // WhatsApp API URL for sending messages
    const whatsappUrl = `https://wa.me/${recipientNumber}?text=${orderText}`;

    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank');
    displayFeedbackMessage('Order sent via WhatsApp!', 'success');
}

/**
 * Formats the selected products into a readable string for display/sharing.
 * This is a helper function used by both copyOrder and sendOrder.
 * @param {Array<Object>} products - The array of products to format.
 * @returns {string} The formatted order text.
 */
function formatOrderText(products) {
    let text = '';
    let currentGroupAlias = null;

    products.forEach(item => {
        const { productGroupAlias, productName, productGroup, quantity } = item;
        if (currentGroupAlias !== productGroupAlias) {
            text += `\n*${productGroup}* :\n`;
            currentGroupAlias = productGroupAlias;
        }
        text += `${productName} - ${quantity}\n`;
    });

    let totalQuantity = calculateTotalQuantity(); // Assuming calculateTotalQuantity is accessible globally
    text += `\nTotal : *${totalQuantity}* Pcs.\n`;

    return text.trim();
}
