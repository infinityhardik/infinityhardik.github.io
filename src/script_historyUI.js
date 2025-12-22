/**
 * Order History UI Management
 * Handles rendering and interaction with the history modal
 */

let currentHistorySort = 'newest';
let currentHistorySearch = '';

/**
 * Open the Order History modal
 */
function openOrderHistory() {
    // Clean up old orders before showing
    cleanupOldOrders();

    // Show the modal
    const historyModal = new bootstrap.Modal(document.getElementById('history-modal'));
    historyModal.show();

    // Update the badge count
    updateHistoryBadge();
}

/**
 * Close the Order History modal
 */
function closeOrderHistory() {
    const modalElement = document.getElementById('history-modal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}

/**
 * Render the complete order history
 */
function renderOrderHistory() {
    const historyContainer = document.getElementById('history-container');

    if (!historyContainer) {
        console.error('History container not found');
        return;
    }

    // Get orders
    let orders = getOrderHistory();

    // Apply search filter
    if (currentHistorySearch) {
        orders = searchOrders(currentHistorySearch);
    }

    // Apply sorting
    orders = sortOrderHistory(orders, currentHistorySort);

    // Check if empty
    if (orders.length === 0) {
        historyContainer.innerHTML = renderEmptyState();
        return;
    }

    // Group by date
    const groupedOrders = groupOrdersByDate(orders);

    // Render
    let html = '';

    // Get keys and maintain order (newest dates first if sorted by newest)
    const dateKeys = Object.keys(groupedOrders);
    if (currentHistorySort === 'newest' || currentHistorySort === 'most' || currentHistorySort === 'least') {
        // Keep date keys in order of first appearance (already correct from grouping)
    } else if (currentHistorySort === 'oldest') {
        dateKeys.reverse();
    }

    dateKeys.forEach(dateLabel => {
        const group = groupedOrders[dateLabel];
        html += renderDateGroup(group);
    });

    historyContainer.innerHTML = html;
}

/**
 * Render empty state
 */
function renderEmptyState() {
    const hasSearch = currentHistorySearch && currentHistorySearch.trim() !== '';

    if (hasSearch) {
        return `
            <div class="history-empty-state">
                <div class="empty-icon">🔍</div>
                <h4>No Results Found</h4>
                <p>No orders match "${currentHistorySearch}"</p>
                <button class="btn btn-secondary" onclick="clearHistorySearch()">Clear Search</button>
            </div>
        `;
    }

    return `
        <div class="history-empty-state">
            <div class="empty-icon">📭</div>
            <h4>No Order History Yet</h4>
            <p>Your sent and copied orders will appear here.</p>
            <p class="text-muted">Orders are automatically saved for 7 days.</p>
            <button class="btn btn-primary" onclick="closeOrderHistory()">Start Creating Orders →</button>
        </div>
    `;
}

/**
 * Render a date group
 */
function renderDateGroup(group) {
    let html = `
        <div class="history-date-group">
            <div class="date-group-header">
                <span class="date-icon">📅</span>
                <span class="date-label">${group.label}</span>
                ${group.label !== group.fullDate ? `<span class="date-full text-muted">- ${group.fullDate}</span>` : ''}
            </div>
            <div class="date-group-orders">
    `;

    group.orders.forEach(order => {
        html += renderOrderCard(order);
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render an individual order card
 */
function renderOrderCard(order) {
    const timeLabel = formatTimeLabel(new Date(order.timestamp));
    const statusClass = order.action === 'sent' ? 'status-sent' : 'status-copied';
    const statusIcon = order.sentVia === 'whatsapp' ? '📱' : '📋';

    // Get preview (first 2-3 products)
    const previewProducts = order.products.slice(0, 2);
    const remaining = order.products.length - previewProducts.length;

    let preview = previewProducts.map(p => `${p.productName} - ${p.quantity}`).join(', ');
    if (remaining > 0) {
        preview += ` ... and ${remaining} more`;
    }

    return `
        <div class="history-order-card ${statusClass}" data-order-id="${order.id}">
            <div class="order-card-header">
                <div class="order-time">
                    <span class="time-icon">⏰</span>
                    <span class="time-label">${timeLabel}</span>
                </div>
                <div class="order-count">
                    <span class="count-icon">📦</span>
                    <span class="count-label">${order.totalItems} items</span>
                </div>
            </div>
            <div class="order-card-preview">
                ${preview}
            </div>
            <div class="order-card-actions">
                <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onclick="viewOrderDetails('${order.id}')" title="View full order details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    View
                </button>
                <button class="btn btn-sm btn-outline-info d-flex align-items-center gap-1" onclick="editOrderFromHistory('${order.id}')" title="Load order for editing">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Edit
                </button>
                <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onclick="copyOrderFromHistory('${order.id}')" title="Copy order text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                </button>
                <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onclick="confirmDeleteOrder('${order.id}')" title="Delete this order">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Delete
                </button>
            </div>
        </div>
    `;
}

/**
 * Update the history badge count
 */
function updateHistoryBadge() {
    const count = getOrderHistoryCount();
    const badge = document.getElementById('history-badge');

    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Handle history search input
 */
function handleHistorySearch(query) {
    currentHistorySearch = query;
    renderOrderHistory();
}

/**
 * Clear history search
 */
function clearHistorySearch() {
    currentHistorySearch = '';
    const searchInput = document.getElementById('history-search');
    if (searchInput) {
        searchInput.value = '';
    }
    renderOrderHistory();
}

/**
 * Handle sort change
 */
function handleHistorySort(sortBy) {
    currentHistorySort = sortBy;
    renderOrderHistory();
}

/**
 * View order details in a modal
 */
function viewOrderDetails(orderId) {
    const order = getOrderById(orderId);

    if (!order) {
        displayFeedbackMessage('Order not found', 'error');
        return;
    }

    // Populate the view modal
    document.getElementById('view-order-title').textContent =
        `Order Details - ${formatDateLabel(new Date(order.timestamp))} at ${formatTimeLabel(new Date(order.timestamp))}`;

    document.getElementById('view-order-content').textContent = order.orderText;

    // Store current order ID for actions
    document.getElementById('view-order-modal').dataset.orderId = orderId;

    // Show the modal
    const viewModal = new bootstrap.Modal(document.getElementById('view-order-modal'));
    viewModal.show();
}

/**
 * Edit order from history (load into current workspace)
 */
function editOrderFromHistory(orderId) {
    const order = getOrderById(orderId);

    if (!order) {
        displayFeedbackMessage('Order not found', 'error');
        return;
    }

    // Clear current order first
    clearOrder();

    // Load products into current order
    order.products.forEach(product => {
        updateProductQuantityInOrder(product.productName, product.quantity);
    });

    // Close history modal
    closeOrderHistory();

    // Show feedback
    displayFeedbackMessage('✏️ Order loaded for editing. Modify and send as a new order.', 'success');

    // Scroll to top to show the loaded order
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Copy order from history
 */
function copyOrderFromHistory(orderId) {
    const order = getOrderById(orderId);

    if (!order) {
        displayFeedbackMessage('Order not found', 'error');
        return;
    }

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(order.orderText)
            .then(() => {
                displayFeedbackMessage('Order copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                displayFeedbackMessage('Failed to copy order', 'error');
            });
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = order.orderText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            displayFeedbackMessage('Order copied to clipboard!', 'success');
        } catch (err) {
            displayFeedbackMessage('Failed to copy order', 'error');
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Confirm and delete order
 */
function confirmDeleteOrder(orderId) {
    // Simple confirmation
    if (confirm('Are you sure you want to delete this order from history?')) {
        const success = deleteOrderFromHistory(orderId);

        if (success) {
            displayFeedbackMessage('Order deleted from history', 'success');
            renderOrderHistory();
            updateHistoryBadge();
        } else {
            displayFeedbackMessage('Failed to delete order', 'error');
        }
    }
}

/**
 * Copy from view modal
 */
function copyFromViewModal() {
    const orderId = document.getElementById('view-order-modal').dataset.orderId;
    copyOrderFromHistory(orderId);
}

/**
 * Edit from view modal
 */
function editFromViewModal() {
    const orderId = document.getElementById('view-order-modal').dataset.orderId;

    // Close view modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('view-order-modal'));
    if (viewModal) {
        viewModal.hide();
    }

    // Edit the order
    editOrderFromHistory(orderId);
}

/**
 * Send again from view modal
 */
function sendAgainFromViewModal() {
    const orderId = document.getElementById('view-order-modal').dataset.orderId;
    editOrderFromHistory(orderId);

    // Close view modal
    const viewModal = bootstrap.Modal.getInstance(document.getElementById('view-order-modal'));
    if (viewModal) {
        viewModal.hide();
    }

    // Trigger send order (user will need to confirm via WhatsApp)
    setTimeout(() => {
        sendOrder();
    }, 500);
}

/**
 * Attach event listeners to history elements
 */
function attachHistoryEventListeners() {
    // Search input
    const searchInput = document.getElementById('history-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleHistorySearch(e.target.value);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('history-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            handleHistorySort(e.target.value);
        });
    }
}

/**
 * Confirm and clear all order history
 */
function confirmClearAllHistory() {
    if (confirm('Are you sure you want to delete ALL order history? This action cannot be undone.')) {
        if (clearAllHistory()) {
            displayFeedbackMessage('All order history cleared', 'success');
            renderOrderHistory();
            updateHistoryBadge();
        } else {
            displayFeedbackMessage('Failed to clear history', 'error');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    updateHistoryBadge();

    // Initialize search and sort listeners ONCE
    const historyModalElement = document.getElementById('history-modal');
    if (historyModalElement) {
        // Render on show
        historyModalElement.addEventListener('show.bs.modal', () => {
            renderOrderHistory();
        });

        // Initialize listeners once
        attachHistoryEventListeners();

        // Focus search input when modal is shown (only on non-mobile devices)
        historyModalElement.addEventListener('shown.bs.modal', () => {
            const searchInput = document.getElementById('history-search');
            // Check if isMobileDevice function exists and return false if not on mobile
            const isMobile = typeof isMobileDevice === 'function' ? isMobileDevice() : false;

            if (searchInput && !isMobile) {
                searchInput.focus();
            }
        });
    }
});
