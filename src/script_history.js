/**
 * Order History Management
 * Handles saving, loading, and managing order history in localStorage
 * Auto-cleanup of orders older than 7 days
 */

const ORDER_HISTORY_KEY = 'orderHistory';
const MAX_HISTORY_ITEMS = 100;
const CLEANUP_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Writes the history list. localStorage can throw (storage full, private
 * browsing, site data blocked), so every write goes through here.
 * @param {Array<Object>} history
 * @returns {boolean} Success status
 */
function writeOrderHistory(history) {
    try {
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));
        return true;
    } catch (error) {
        console.error('Error saving order history:', error);
        if (error && error.name === 'QuotaExceededError') {
            displayFeedbackMessage('Storage limit reached. Please clear some history.', 'error');
        }
        return false;
    }
}

/**
 * Save an order to history
 * @param {Array<Object>} products - Array of product objects with quantities
 * @param {string} action - 'sent' or 'copied'
 * @param {string} sentVia - 'whatsapp' or 'clipboard'
 * @returns {boolean} Success status
 */
function saveOrderToHistory(products, action = 'sent', sentVia = 'whatsapp') {
    if (!products || products.length === 0) return false;

    const timestamp = Date.now();
    const order = {
        id: `${timestamp}_${Math.random().toString(36).slice(2, 11)}`,
        timestamp,
        dateCreated: new Date(timestamp).toISOString(),
        products: products.map(p => ({ ...p })), // copy: later edits to the order don't change history
        totalItems: products.reduce((sum, item) => sum + item.quantity, 0),
        orderText: formatOrderText(sortProducts(products)),
        action,
        sentVia
    };

    // Newest first, capped at MAX_HISTORY_ITEMS
    const history = getOrderHistory();
    history.unshift(order);
    history.length = Math.min(history.length, MAX_HISTORY_ITEMS);

    return writeOrderHistory(history);
}

/**
 * Get all orders from history
 * @returns {Array<Object>} Array of order objects ([] when missing or unreadable)
 */
function getOrderHistory() {
    let history;
    try {
        history = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY) || '[]');
    } catch (error) {
        console.error('Error loading order history:', error);
        history = null;
    }

    if (!Array.isArray(history)) {
        // Corrupted or unreadable: start over rather than break the page
        writeOrderHistory([]);
        return [];
    }

    // Drop entries that couldn't be shown or restored (e.g. written by an old version)
    return history.filter(o => o && typeof o === 'object' && Array.isArray(o.products) && typeof o.timestamp === 'number');
}

/**
 * Get a specific order by ID
 * @param {string} orderId - The order ID to retrieve
 * @returns {Object|null} The order object or null if not found
 */
function getOrderById(orderId) {
    return getOrderHistory().find(order => order.id === orderId) || null;
}

/**
 * Delete an order from history
 * @param {string} orderId - The order ID to delete
 * @returns {boolean} Success status
 */
function deleteOrderFromHistory(orderId) {
    const history = getOrderHistory();
    const filteredHistory = history.filter(order => order.id !== orderId);
    if (filteredHistory.length === history.length) return false;
    return writeOrderHistory(filteredHistory);
}

/**
 * Clean up orders older than CLEANUP_DAYS
 * @returns {number} Number of orders cleaned up
 */
function cleanupOldOrders() {
    const history = getOrderHistory();
    const cutoffTime = Date.now() - (CLEANUP_DAYS * MILLISECONDS_PER_DAY);
    const filteredHistory = history.filter(order => order.timestamp >= cutoffTime);
    const cleanedCount = history.length - filteredHistory.length;

    if (cleanedCount > 0 && writeOrderHistory(filteredHistory)) {
        displayFeedbackMessage(`Cleaned up ${cleanedCount} old order${cleanedCount > 1 ? 's' : ''}`, 'success');
        return cleanedCount;
    }
    return 0;
}

/**
 * Clear all order history
 * @returns {boolean} Success status
 */
function clearAllHistory() {
    return writeOrderHistory([]);
}

/**
 * Format a date for display in the history
 * @param {Date} date - The date to format
 * @returns {string} Formatted date label
 */
function formatDateLabel(date) {
    const now = new Date();
    const orderDate = new Date(date);

    // Compare calendar days, ignoring the time of day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    // Rounded: a day across a daylight-saving change is 23 or 25 hours long
    const diffDays = Math.round((today - compareDate) / MILLISECONDS_PER_DAY);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[orderDate.getDay()];
    }
    return orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Format time for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted time (e.g., "6:31 PM")
 */
function formatTimeLabel(date) {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Remove expired orders once the page is ready
document.addEventListener('DOMContentLoaded', cleanupOldOrders);
