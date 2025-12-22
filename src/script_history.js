/**
 * Order History Management
 * Handles saving, loading, and managing order history in localStorage
 * Auto-cleanup of orders older than 7 days
 */

const ORDER_HISTORY_KEY = 'orderHistory';
const LAST_CLEANUP_KEY = 'lastCleanup';
const MAX_HISTORY_ITEMS = 100;
const CLEANUP_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Initialize order history system on page load
 */
function initializeOrderHistory() {
    // Perform cleanup on initialization
    cleanupOldOrders();
}

/**
 * Save an order to history
 * @param {Array<Object>} products - Array of product objects with quantities
 * @param {string} action - 'sent' or 'copied'
 * @param {string} sentVia - 'whatsapp' or 'clipboard'
 * @returns {boolean} Success status
 */
function saveOrderToHistory(products, action = 'sent', sentVia = 'whatsapp') {
    try {
        if (!products || products.length === 0) {
            console.warn('Cannot save empty order to history');
            return false;
        }

        // Get existing history
        const history = getOrderHistory();

        // Create order object
        const timestamp = Date.now();
        const orderId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

        const orderObject = {
            id: orderId,
            timestamp: timestamp,
            dateCreated: new Date(timestamp).toISOString(),
            products: [...products], // Deep copy
            totalItems: products.reduce((sum, item) => sum + item.quantity, 0),
            orderText: formatOrderText(sortProducts(products)),
            action: action,
            sentVia: sentVia
        };

        // Add to beginning of history (newest first)
        history.unshift(orderObject);

        // Enforce max limit
        if (history.length > MAX_HISTORY_ITEMS) {
            history.splice(MAX_HISTORY_ITEMS);
        }

        // Save to localStorage
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));

        console.log(`Order saved to history: ${orderId}`);
        return true;

    } catch (error) {
        console.error('Error saving order to history:', error);

        // Check if quota exceeded
        if (error.name === 'QuotaExceededError') {
            displayFeedbackMessage('Storage limit reached. Please clear some history.', 'error');
        }

        return false;
    }
}

/**
 * Get all orders from history
 * @returns {Array<Object>} Array of order objects
 */
function getOrderHistory() {
    try {
        const historyJson = localStorage.getItem(ORDER_HISTORY_KEY);

        if (!historyJson) {
            return [];
        }

        const history = JSON.parse(historyJson);

        // Validate that it's an array
        if (!Array.isArray(history)) {
            console.warn('Invalid history format, resetting...');
            localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([]));
            return [];
        }

        return history;

    } catch (error) {
        console.error('Error loading order history:', error);
        // Reset corrupted data
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([]));
        return [];
    }
}

/**
 * Get a specific order by ID
 * @param {string} orderId - The order ID to retrieve
 * @returns {Object|null} The order object or null if not found
 */
function getOrderById(orderId) {
    const history = getOrderHistory();
    return history.find(order => order.id === orderId) || null;
}

/**
 * Delete an order from history
 * @param {string} orderId - The order ID to delete
 * @returns {boolean} Success status
 */
function deleteOrderFromHistory(orderId) {
    try {
        const history = getOrderHistory();
        const filteredHistory = history.filter(order => order.id !== orderId);

        if (filteredHistory.length === history.length) {
            console.warn('Order not found in history:', orderId);
            return false;
        }

        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(filteredHistory));
        console.log(`Order deleted from history: ${orderId}`);
        return true;

    } catch (error) {
        console.error('Error deleting order from history:', error);
        return false;
    }
}

/**
 * Clean up orders older than CLEANUP_DAYS
 * @returns {number} Number of orders cleaned up
 */
function cleanupOldOrders() {
    try {
        const history = getOrderHistory();
        const now = Date.now();
        const cutoffTime = now - (CLEANUP_DAYS * MILLISECONDS_PER_DAY);

        const filteredHistory = history.filter(order => order.timestamp >= cutoffTime);
        const cleanedCount = history.length - filteredHistory.length;

        if (cleanedCount > 0) {
            localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(filteredHistory));
            localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
            console.log(`Cleaned up ${cleanedCount} old orders`);

            // Show subtle notification
            if (cleanedCount > 0) {
                displayFeedbackMessage(`Cleaned up ${cleanedCount} old order${cleanedCount > 1 ? 's' : ''}`, 'success');
            }
        }

        return cleanedCount;

    } catch (error) {
        console.error('Error during cleanup:', error);
        return 0;
    }
}

/**
 * Search orders by query string
 * @param {string} query - Search query
 * @returns {Array<Object>} Filtered orders
 */
function searchOrders(query) {
    if (!query || query.trim() === '') {
        return getOrderHistory();
    }

    const history = getOrderHistory();
    const searchLower = query.toLowerCase().trim();

    return history.filter(order => {
        // Search in order text
        if (order.orderText.toLowerCase().includes(searchLower)) {
            return true;
        }

        // Search in product names
        const hasMatchingProduct = order.products.some(product =>
            product.productName.toLowerCase().includes(searchLower)
        );
        if (hasMatchingProduct) {
            return true;
        }

        // Search in formatted date
        const dateStr = formatDateLabel(new Date(order.timestamp)).toLowerCase();
        if (dateStr.includes(searchLower)) {
            return true;
        }

        // Search in total items
        if (order.totalItems.toString().includes(searchLower)) {
            return true;
        }

        return false;
    });
}

/**
 * Sort orders by different criteria
 * @param {Array<Object>} orders - Orders to sort
 * @param {string} sortBy - Sort criteria: 'newest', 'oldest', 'most', 'least'
 * @returns {Array<Object>} Sorted orders
 */
function sortOrderHistory(orders, sortBy = 'newest') {
    const sorted = [...orders]; // Create copy

    switch (sortBy) {
        case 'newest':
            sorted.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'oldest':
            sorted.sort((a, b) => a.timestamp - b.timestamp);
            break;
        case 'most':
            sorted.sort((a, b) => b.totalItems - a.totalItems);
            break;
        case 'least':
            sorted.sort((a, b) => a.totalItems - b.totalItems);
            break;
        default:
            // Default to newest first
            sorted.sort((a, b) => b.timestamp - a.timestamp);
    }

    return sorted;
}

/**
 * Get the count of orders in history
 * @returns {number} Number of orders
 */
function getOrderHistoryCount() {
    return getOrderHistory().length;
}

/**
 * Clear all order history (with confirmation)
 * @returns {boolean} Success status
 */
function clearAllHistory() {
    try {
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify([]));
        localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
        console.log('All order history cleared');
        return true;
    } catch (error) {
        console.error('Error clearing history:', error);
        return false;
    }
}

/**
 * Format a date for display in the history
 * @param {Date} date - The date to format
 * @returns {string} Formatted date label
 */
function formatDateLabel(date) {
    const now = new Date();
    const orderDate = new Date(date);

    // Reset hours for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

    const diffTime = today - compareDate;
    const diffDays = Math.floor(diffTime / MILLISECONDS_PER_DAY);

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        // Day name
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[orderDate.getDay()];
    } else {
        // Full date
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return orderDate.toLocaleDateString('en-US', options);
    }
}

/**
 * Format time for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted time (e.g., "6:31 PM")
 */
function formatTimeLabel(date) {
    const orderDate = new Date(date);
    return orderDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Group orders by date
 * @param {Array<Object>} orders - Orders to group
 * @returns {Object} Object with date labels as keys and arrays of orders as values
 */
function groupOrdersByDate(orders) {
    const grouped = {};

    orders.forEach(order => {
        const dateLabel = formatDateLabel(new Date(order.timestamp));

        if (!grouped[dateLabel]) {
            grouped[dateLabel] = {
                label: dateLabel,
                fullDate: new Date(order.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                orders: []
            };
        }

        grouped[dateLabel].orders.push(order);
    });

    return grouped;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initializeOrderHistory();
});
