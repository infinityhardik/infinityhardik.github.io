const WHATSAPP_RECIPIENT = '+916355360702';

/**
 * Checks if there are any products currently selected in the order.
 * @param {Array<Object>} products - The products currently in the order.
 * @returns {boolean} True if products exist in the order, false otherwise.
 */
function hasProducts(products) {
    if (products.length === 0) {
        displayFeedbackMessage('No products in the order. Please add products.', 'warning');
        return false;
    }
    return true;
}

// Same ordering as String#localeCompare, but built once instead of on every comparison
const _orderCollator = new Intl.Collator();

/**
 * Sorts products by Group Alias, then Product Category, then Product Name.
 * @param {Array<Object>} products - The products to sort.
 * @returns {Array<Object>} A new, sorted array (the input is left untouched).
 */
function sortProducts(products) {
    const compare = _orderCollator.compare;
    return [...products].sort((a, b) =>
        compare(a.productGroupAlias, b.productGroupAlias) ||
        compare(a.productCategory, b.productCategory) ||
        compare(a.productName, b.productName)
    );
}

/**
 * Formats products into the order text shown in the order panels, copied, and
 * sent: a *bold* heading per group, one "name - qty" line per product, then
 * the total.
 * @param {Array<Object>} products - The products to format, already sorted.
 * @returns {string} The formatted order text ('' for an empty order).
 */
function formatOrderText(products) {
    if (products.length === 0) return '';

    let text = '';
    let currentGroupAlias = null;
    let totalQuantity = 0;

    products.forEach(({ productGroupAlias, productName, productGroup, quantity }) => {
        if (currentGroupAlias !== productGroupAlias) {
            text += `\n*${productGroup}* :\n`;
            currentGroupAlias = productGroupAlias;
        }
        text += `${productName} - ${quantity}\n`;
        totalQuantity += quantity;
    });

    text += `\nTotal : *${totalQuantity}* Pcs.\n`;
    return text.trim();
}

/**
 * Puts text on the clipboard: the Clipboard API where available, otherwise
 * the older execCommand('copy') route (e.g. pages not served over HTTPS).
 * @param {string} text
 * @returns {Promise<void>} Rejects when the copy failed.
 */
function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; // no scroll to the bottom
        document.body.appendChild(textarea);
        textarea.select();
        try {
            if (document.execCommand('copy')) resolve();
            else reject(new Error('execCommand copy failed'));
        } catch (err) {
            reject(err);
        } finally {
            textarea.remove();
        }
    });
}

/**
 * Copies the current order text to the clipboard.
 */
function copyOrder() {
    if (!hasProducts(selectedProducts)) return;

    // Snapshot now: the order can change before the clipboard write finishes
    const products = [...selectedProducts];
    copyTextToClipboard(formatOrderText(sortProducts(products)))
        .then(() => {
            displayFeedbackMessage('Order copied to clipboard!', 'success');
            flashSuccess('copyOrder');
            haptic();
            // Raw (unsorted) products keep the insertion order for "Edit" from history
            saveOrderToHistory(products, 'copied', 'clipboard');
        })
        .catch(err => {
            console.error('Failed to copy order text:', err);
            displayFeedbackMessage('Failed to copy order. Please try again.', 'error');
        });
}

/**
 * Sends the current order via WhatsApp.
 */
function sendOrder() {
    if (!hasProducts(selectedProducts)) return;

    const orderText = formatOrderText(sortProducts(selectedProducts));
    const whatsappUrl = `https://wa.me/${WHATSAPP_RECIPIENT}?text=${encodeURIComponent(orderText)}`;

    // Vibrate before WhatsApp opens: once the phone switches apps this page is
    // in the background, and browsers don't let a background page vibrate
    haptic();

    window.open(whatsappUrl, '_blank');
    displayFeedbackMessage('Order sent via WhatsApp!', 'success');
    flashSuccess('sendOrder');

    // Raw (unsorted) products keep the insertion order for "Edit" from history
    saveOrderToHistory(selectedProducts, 'sent', 'whatsapp');
}
