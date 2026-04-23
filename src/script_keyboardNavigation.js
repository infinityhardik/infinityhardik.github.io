// Track the currently focused index for keyboard navigation in the product list.
let currentFocusIndex = -1;

document.addEventListener("keydown", function (event) {
    const searchBox = document.getElementById("search-box");
    if (!searchBox) return;

    // Check for open modals/popups using the design system's .active class
    const activeModal = document.querySelector(".modal-overlay.active");
    const isModalOpen = !!activeModal;

    // ─── Global Shortcuts (when no modal is open) ───────────────────────────
    if (!isModalOpen) {
        // Ctrl shortcuts
        if (event.ctrlKey) {
            const key = event.key.toLowerCase();
            switch (key) {
                case 'f': // Filter Modal
                    if (event.shiftKey) {
                        event.preventDefault();
                        const filterBtn = document.getElementById('filterProductList');
                        if (filterBtn) filterBtn.click();
                        return;
                    }
                    break;
                case 'o': // Order Popup or Clear Filters
                    event.preventDefault();
                    if (event.shiftKey) {
                        const clearFiltersBtn = document.getElementById('clearFilters');
                        if (clearFiltersBtn) clearFiltersBtn.click();
                    } else {
                        if (typeof toggleOrderPopup === 'function') toggleOrderPopup();
                    }
                    return;
                case 'delete': // Clear Order
                    event.preventDefault();
                    if (typeof clearOrder === 'function') clearOrder();
                    return;
                case 'backspace': // Clear Search
                    event.preventDefault();
                    if (typeof clearSearch === 'function') clearSearch();
                    return;
                case 'enter': // Send Order
                    event.preventDefault();
                    if (typeof sendOrder === 'function') sendOrder();
                    return;
                case 'c': // Copy Order
                    event.preventDefault();
                    if (typeof copyOrder === 'function') copyOrder();
                    return;
                case 'h': // History
                    event.preventDefault();
                    if (typeof openOrderHistory === 'function') openOrderHistory();
                    return;
                case 's': // Toggle Show Selected
                    event.preventDefault();
                    if (typeof toggleShowSelectedOnly === 'function') toggleShowSelectedOnly();
                    return;
                case '/': // Help
                case '?':
                    event.preventDefault();
                    const helpBtn = document.getElementById('helpButton');
                    if (helpBtn) helpBtn.click();
                    return;
            }
        }

        // ─── Escape Key Handling ───────────────────────────────────────────
        if (event.key === "Escape") {
            if (searchBox.value !== "") {
                event.preventDefault();
                if (typeof clearSearch === 'function') clearSearch();
            } else if (document.activeElement === searchBox) {
                searchBox.blur();
            }
            return;
        }

        // ─── Alphanumeric Keys (focus search) ───────────────────────────
        if ((/^[a-zA-Z0-9]$/.test(event.key) || event.key === '-' || event.key === ' ') && 
            !event.ctrlKey && !event.altKey && !event.metaKey) {
            const active = document.activeElement;
            const isInput = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';
            if (active !== searchBox && !isInput) {
                searchBox.focus();
                // Cursor to end
                searchBox.setSelectionRange(searchBox.value.length, searchBox.value.length);
            }
        }

        // ─── List Navigation (Arrows) ───────────────────────────────────────
        const productList = document.getElementById("product-list");
        // Guard: only consider actual product rows (excludes #no-results and any other sibling elements)
        const visibleItems = Array.from(productList.children).filter(
            li => li.classList.contains('product-item') && !li.classList.contains('hidden')
        );

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (visibleItems.length === 0) return;

            if (event.key === "ArrowDown") {
                if (currentFocusIndex === -1) {
                    // ↓ First press from search box → always land on first item
                    currentFocusIndex = 0;
                } else if (currentFocusIndex < visibleItems.length - 1) {
                    currentFocusIndex++;
                } else {
                    currentFocusIndex = 0; // Wrap to top
                }
            } else { // ArrowUp
                if (currentFocusIndex <= 0) {
                    // ↑ On first item (or already at search) → return to search box
                    currentFocusIndex = -1;
                    updateListFocus(visibleItems);
                    searchBox.focus();
                    return;
                } else {
                    currentFocusIndex--;
                }
            }

            updateListFocus(visibleItems);
            return;
        }

        // ─── Quantity Shortcuts (Left/Right) ─────────────────────────────────
        if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && currentFocusIndex >= 0) {
            const item = visibleItems[currentFocusIndex];
            if (item) {
                event.preventDefault();
                const productName = item.dataset.productName;
                const change = event.key === "ArrowRight" ? 1 : -1;
                if (typeof updateProductQuantityInOrder === 'function') {
                    updateProductQuantityInOrder(productName, change);
                }
            }
            return;
        }

        // ─── Enter Key (Select/Detail) ───────────────────────────────────────
        if (event.key === "Enter") {
            if (currentFocusIndex >= 0 && visibleItems[currentFocusIndex]) {
                event.preventDefault();
                const infoDiv = visibleItems[currentFocusIndex].querySelector('.product-info');
                if (infoDiv) infoDiv.click();
            } else if (document.activeElement === searchBox) {
                // Already handled by input logic usually, but let's ensure Enter 
                // on search doesn't do anything weird if we're not using it for quantity
            }
        }

    } else {
        // ─── Modal Shortcuts ────────────────────────────────────────────────
        if (event.key === "Escape") {
            event.preventDefault();
            const closeBtn = activeModal.querySelector('.modal-header button, .modal-footer .btn-secondary');
            if (closeBtn) closeBtn.click();
            else if (typeof Modal !== 'undefined') Modal.close(activeModal.id);
        }
    }
});

/**
 * Updates the visual and ARIA focus states for the list.
 */
function updateListFocus(visibleItems) {
    const searchBox = document.getElementById("search-box");
    
    // Update aria-expanded based on results
    if (searchBox) {
        searchBox.setAttribute('aria-expanded', visibleItems.length > 0 ? 'true' : 'false');
    }

    // Remove all old focus classes
    document.querySelectorAll('.product-item.keyboard-focus').forEach(el => {
        el.classList.remove('keyboard-focus');
        el.setAttribute('aria-selected', el.classList.contains('added-to-order') ? 'true' : 'false');
    });

    if (currentFocusIndex >= 0 && visibleItems[currentFocusIndex]) {
        const item = visibleItems[currentFocusIndex];
        item.classList.add('keyboard-focus');
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        
        // Update ARIA
        if (searchBox) {
            searchBox.setAttribute('aria-activedescendant', item.id);
        }
    } else {
        if (searchBox) {
            searchBox.removeAttribute('aria-activedescendant');
        }
    }
}

/**
 * Resets the focus index, usually called after filtering.
 */
function resetFocus() {
    currentFocusIndex = -1;
    const searchBox = document.getElementById("search-box");
    if (searchBox) searchBox.removeAttribute('aria-activedescendant');
    
    document.querySelectorAll('.product-item.keyboard-focus').forEach(el => {
        el.classList.remove('keyboard-focus');
    });
}

// Ensure focus is reset after filtering
const searchInput = document.getElementById("search-box");
if (searchInput) {
    searchInput.addEventListener("input", () => {
        resetFocus();
    });
}

const observer = new MutationObserver(() => {
    // If the focused item was removed or hidden, reset focus
    const productList = document.getElementById("product-list");
    if (!productList) return;
    
    // Guard: only consider actual product rows (excludes #no-results and any other sibling elements)
    const visibleItems = Array.from(productList.children).filter(
        li => li.classList.contains('product-item') && !li.classList.contains('hidden')
    );
    
    const searchBox = document.getElementById("search-box");
    if (searchBox) {
        searchBox.setAttribute('aria-expanded', visibleItems.length > 0 ? 'true' : 'false');
    }

    if (currentFocusIndex >= visibleItems.length) {
        resetFocus();
    }
});

const productListEl = document.getElementById("product-list");
if (productListEl) {
    observer.observe(productListEl, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['style', 'class'] 
    });
}

