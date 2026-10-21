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
    attachHistoryListeners();
}

function renderOrderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;

    let orders = getOrderHistory();

    // The footer only holds "Clear History" — hide it when there is nothing to clear
    const clearAllBtn = document.getElementById('clear-history-btn');
    if (clearAllBtn) clearAllBtn.closest('.modal-footer').classList.toggle('is-hidden', orders.length === 0);

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
        container.innerHTML = currentHistorySearch
            ? `<div class="history-empty">
                   <p class="history-empty-title">No matching orders</p>
                   <p>Try another product name.</p>
               </div>`
            : `<div class="history-empty">
                   <div class="history-empty-icon" aria-hidden="true">📭</div>
                   <p class="history-empty-title">No orders yet</p>
                   <p>Sent and copied orders appear here for 7 days.</p>
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
        <section class="history-group">
            <h3 class="history-group-label">${label}</h3>
            ${grpOrders.map(renderHistoryCard).join('')}
        </section>`).join('');
}

const HISTORY_ICONS = {
    sent: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>',
    copied: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>',
    edit: '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>',
    copy: '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>',
    delete: '<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>',
};

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * One order: time, how it left (Sent / Copied) and its size; the product
 * names, which expand into the full order text; then Edit · Copy · Delete.
 */
function renderHistoryCard(o) {
    const copied = o.action === 'copied';
    const names = o.products.slice(0, 3).map(p => escapeHtml(p.productName)).join(', ');
    const more = o.products.length > 3 ? ` <span class="history-more">+${o.products.length - 3} more</span>` : '';
    const itemCount = `${o.products.length} item${o.products.length === 1 ? '' : 's'}`;
    // Full order with WhatsApp *bold* markers shown as bold, as in the order panel
    const fullText = escapeHtml(o.orderText || '').replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    return `
        <article class="history-card">
            <div class="history-card-head">
                <span class="history-time">${formatTimeLabel(new Date(o.timestamp))}</span>
                <span class="history-via${copied ? ' is-copied' : ''}">${copied ? HISTORY_ICONS.copied + 'Copied' : HISTORY_ICONS.sent + 'Sent'}</span>
                <span class="history-size">${o.totalItems} pcs · ${itemCount}</span>
            </div>
            <details class="history-details">
                <summary class="history-names">${names}${more}</summary>
                <div class="history-order-text">${fullText}</div>
            </details>
            <div class="history-actions">
                <button class="btn btn-primary btn-sm" onclick="editOrderFromHistory('${o.id}')">${HISTORY_ICONS.edit}Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="copyOrderFromHistory('${o.id}')">${HISTORY_ICONS.copy}Copy</button>
                <button class="btn btn-ghost-danger btn-sm btn-push-end" onclick="confirmDeleteOrder('${o.id}', this)">${HISTORY_ICONS.delete}Delete</button>
            </div>
        </article>`;
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
        if (typeof refreshProductList === 'function') {
            refreshProductList();
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

/**
 * Two-tap confirmation inside the page. The browser's confirm() dialog is
 * blocked in in-app browsers (e.g. links opened from WhatsApp) and in some
 * webviews, where it returns "Cancel" instantly — so Delete did nothing there.
 * First tap: the button asks "Tap to confirm" for 3 s. Second tap: runs action.
 */
function confirmByTap(btn, action) {
    if (btn.dataset.confirming) {
        btn._resetConfirm();
        action();
        return;
    }
    const original = btn.innerHTML;
    btn.dataset.confirming = '1';
    btn.classList.add('is-confirming');
    btn.textContent = 'Tap to confirm';
    btn._resetConfirm = () => {
        clearTimeout(btn._confirmTimer);
        delete btn.dataset.confirming;
        btn.classList.remove('is-confirming');
        btn.innerHTML = original;
    };
    btn._confirmTimer = setTimeout(btn._resetConfirm, 3000);
}

function confirmDeleteOrder(orderId, btn) {
    const remove = () => {
        deleteOrderFromHistory(orderId);
        renderOrderHistory();
    };
    if (btn) confirmByTap(btn, remove);
    else if (confirm('Delete this order from history?')) remove();
}

function confirmClearAllHistory(btn) {
    const clear = () => {
        clearAllHistory();
        renderOrderHistory();
        displayFeedbackMessage('History cleared.', 'success');
    };
    if (btn) confirmByTap(btn, clear);
    else if (confirm('Clear ALL order history? This cannot be undone.')) clear();
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
