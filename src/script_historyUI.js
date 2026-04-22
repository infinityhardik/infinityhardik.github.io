/**
 * Order History UI
 */
let currentHistorySort = 'newest';
let currentHistorySearch = '';

// Called by the History button in HTML
function openOrderHistory() {
    cleanupOldOrders();
    renderOrderHistory();
    Modal.open('history-modal');
    updateHistoryBadge();
    attachHistoryListeners();
}

function renderOrderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    let orders = getOrderHistory();

    if (currentHistorySearch) {
        const q = currentHistorySearch.toLowerCase();
        orders = orders.filter(o =>
            o.orderText.toLowerCase().includes(q) ||
            o.products.some(p => p.productName.toLowerCase().includes(q))
        );
    }

    if (currentHistorySort === 'oldest') {
        orders = [...orders].sort((a, b) => a.timestamp - b.timestamp);
    } else {
        orders = [...orders].sort((a, b) => b.timestamp - a.timestamp);
    }

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:var(--color-text-muted)">
                <div style="font-size:2.5rem;margin-bottom:12px">📭</div>
                <p style="font-weight:600">No orders yet</p>
                <p style="font-size:0.85rem;margin-top:4px">Sent and copied orders appear here for 7 days.</p>
            </div>`;
        return;
    }

    // Group by date label
    const groups = {};
    orders.forEach(o => {
        const label = formatDateLabel(new Date(o.timestamp));
        if (!groups[label]) groups[label] = [];
        groups[label].push(o);
    });

    container.innerHTML = Object.entries(groups).map(([label, grpOrders]) => `
        <div style="margin-bottom:20px">
            <div style="font-size:0.75rem;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--color-border)">${label}</div>
            ${grpOrders.map(o => `
                <div class="product-item" style="flex-direction:column;align-items:stretch;gap:8px;margin-bottom:8px;border-radius:var(--radius-md);border:1px solid var(--color-border)">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-weight:700;font-size:0.8rem;color:var(--color-primary)">${formatTimeLabel(new Date(o.timestamp))}</span>
                        <span style="font-size:0.75rem;background:var(--color-bg);padding:2px 8px;border-radius:4px">${o.totalItems} pcs</span>
                    </div>
                    <div style="font-size:0.85rem;color:var(--color-text-muted)">
                        ${o.products.slice(0, 3).map(p => p.productName).join(', ')}${o.products.length > 3 ? ` +${o.products.length - 3} more` : ''}
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.78rem" onclick="editOrderFromHistory('${o.id}')">Edit</button>
                        <button class="btn btn-secondary" style="padding:4px 10px;font-size:0.78rem" onclick="copyOrderFromHistory('${o.id}')">Copy</button>
                        <button class="btn btn-danger" style="padding:4px 10px;font-size:0.78rem;margin-left:auto" onclick="confirmDeleteOrder('${o.id}')">Delete</button>
                    </div>
                </div>`).join('')}
        </div>`).join('');
}

function editOrderFromHistory(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    // 1. Clear current order
    clearOrder();

    // 2. Load products in their saved sequence (insertion order)
    order.products.forEach(p => addToOrder(p.productName, p.quantity));

    // 3. Close modal
    Modal.close('history-modal');

    // 4. Automatically enable "Show Selected Only" so the user sees the restored order immediately
    if (typeof showSelectedOnly !== 'undefined') {
        showSelectedOnly = true;
        if (typeof updateShowSelectedOnlyButton === 'function') updateShowSelectedOnlyButton();
        if (typeof filterProductsAndDisplay === 'function') {
            filterProductsAndDisplay('', { skipScroll: true });
        }
    }

    displayFeedbackMessage('Order loaded for editing.', 'success');
}

function copyOrderFromHistory(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(order.orderText)
            .then(() => displayFeedbackMessage('Order copied!', 'success'))
            .catch(() => displayFeedbackMessage('Copy failed.', 'error'));
    } else {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = order.orderText;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); displayFeedbackMessage('Order copied!', 'success'); }
        catch { displayFeedbackMessage('Copy failed.', 'error'); }
        document.body.removeChild(ta);
    }
}

function confirmDeleteOrder(orderId) {
    if (confirm('Delete this order from history?')) {
        deleteOrderFromHistory(orderId);
        renderOrderHistory();
        updateHistoryBadge();
    }
}

function confirmClearAllHistory() {
    if (confirm('Clear ALL order history? This cannot be undone.')) {
        clearAllHistory();
        renderOrderHistory();
        updateHistoryBadge();
        displayFeedbackMessage('History cleared.', 'success');
    }
}

function updateHistoryBadge() {
    const count = getOrderHistoryCount();
    document.querySelectorAll('.history-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    });
}

let _historyListenersAttached = false;
function attachHistoryListeners() {
    if (_historyListenersAttached) return;
    _historyListenersAttached = true;

    const search = document.getElementById('history-search');
    if (search) {
        search.addEventListener('input', (e) => {
            currentHistorySearch = e.target.value;
            renderOrderHistory();
        });
    }
    const sort = document.getElementById('history-sort');
    if (sort) {
        sort.addEventListener('change', (e) => {
            currentHistorySort = e.target.value;
            renderOrderHistory();
        });
    }
}

document.addEventListener('DOMContentLoaded', updateHistoryBadge);
