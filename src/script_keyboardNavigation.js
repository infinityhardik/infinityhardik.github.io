// Track the currently focused index for keyboard navigation in the product list.
// -1: Search box is focused or no item is focused.
// 0+: Corresponds to the index of the visible product item (0-based).
let currentFocusIndex = -1;

document.addEventListener("keydown", function (event) {
    const searchBox = document.getElementById("search-box");
    const filterModal = document.getElementById("filter-modal");
    const orderModal = document.getElementById("order-modal");
    const helpModal = document.getElementById("help-modal");
    const orderTextPopup = document.getElementById('order-text-popup');

    // Check if any modal or the order text popup is currently open.
    const isFilterModalOpen = filterModal.classList.contains("show");
    const isOrderModalOpen = orderModal.classList.contains("show");
    const isHelpModalOpen = helpModal.classList.contains("show");
    const isOrderPopupOpen = orderTextPopup.classList.contains("show");


    // Handle keyboard shortcuts globally if no modal or popup is open.
    if (!isFilterModalOpen && !isOrderModalOpen && !isHelpModalOpen && !isOrderPopupOpen) {

        // Ctrl + Shift + F: Open Filters Modal
        if (event.ctrlKey && event.shiftKey && (event.key === "f" || event.key === "F")) {
            event.preventDefault(); // Prevent default browser actions (e.g., find)
            document.getElementById('filterProductList').click(); // Simulate click on the Filters button
            return; // Exit to prevent further key processing
        }

        // Ctrl + Shift + O : Clear Filters
        if (event.ctrlKey && event.shiftKey && (event.key === "o" || event.key === "O")) {
            event.preventDefault();
            document.getElementById('clearFilters').click(); // Simulate click on the Clear Filters button
            return;
        }

        // Ctrl + Delete: Clear Entire Order
        if (event.ctrlKey && event.key === "Delete") {
            event.preventDefault();
            clearOrder(); // Call the function to clear the order
            return;
        }

        // Ctrl + Backspace: Clear Search Text
        if (event.ctrlKey && event.key === "Backspace") {
            event.preventDefault();
            clearSearch(); // Properly clear search and filter list
            return;
        }

        // Ctrl + Enter: Send Order via WhatsApp
        if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            sendOrder(); // Call the function to send the order
            return;
        }

        // Ctrl + C: Copy Order Text to Clipboard
        if (event.ctrlKey && (event.key === "c" || event.key === "C")) {
            event.preventDefault();
            copyOrder(); // Call the function to copy the order text
            return;
        }

        // Ctrl + / or ?: Open Help Text Modal
        if (event.ctrlKey && (event.key === "/" || event.key === "?")) {
            event.preventDefault();
            document.getElementById('helpButton').click(); // Simulate click on the Help button
            return;
        }

        // Ctrl + O: Toggle View/Edit Order Popup
        if (event.ctrlKey && !event.shiftKey && (event.key === "o" || event.key === "O")) {
            event.preventDefault();
            toggleOrderPopup(); // Toggle the View/Edit Order popup
            return;
        }

        // Alphanumeric Keys: Focus search box and type the character.
        // This ensures typing directly in the search box even if it's not focused.
        if (/^[a-zA-Z0-9]$/.test(event.key) || event.key === '-' || event.key === ' ') { // Added hyphen and space for search
            // If the search box is not currently focused, focus it
            if (document.activeElement !== searchBox) {
                searchBox.focus();
                // If the search box was not focused and now is, ensure the cursor is at the end
                searchBox.setSelectionRange(searchBox.value.length, searchBox.value.length);
            }
            // Allow default typing behavior for alphanumeric keys in the search box
            // The 'input' event listener on searchBox will handle filtering.
        }

        // Handle Backspace Key: Remove the last character from the search box
        if (event.key === "Backspace" && document.activeElement === searchBox) {
            // Allow default backspace behavior in the search box
            // The 'input' event listener on searchBox will handle filtering.
        }

        // Handle Delete Key: Remove the character after the cursor from the search box
        if (event.key === "Delete" && document.activeElement === searchBox) {
            // Allow default delete behavior in the search box
            // The 'input' event listener on searchBox will handle filtering.
        }

        // Arrow Key Navigation (Down and Up arrows) for product list items.
        const productListContainer = document.getElementById("product-list");
        // Get only the currently visible product items
        // This is simplified as `displayProducts` now only renders visible items.
        const visibleItems = Array.from(productListContainer.children);

        // --- Quantity Change Shortcuts ---
        // Ctrl + Arrow Up or Ctrl + Arrow Right: Increase quantity
        if ((event.ctrlKey && (event.key === "ArrowUp" || event.key === "ArrowRight")) && currentFocusIndex >= 0 && currentFocusIndex < visibleItems.length) {
            event.preventDefault();
            const productName = visibleItems[currentFocusIndex].dataset.productName;
            if (productName) {
                updateProductQuantityInOrder(productName, 1);
            }
            return;
        }
        // Ctrl + Arrow Down or Ctrl + Arrow Left: Decrease quantity
        if ((event.ctrlKey && (event.key === "ArrowDown" || event.key === "ArrowLeft")) && currentFocusIndex >= 0 && currentFocusIndex < visibleItems.length) {
            event.preventDefault();
            const productName = visibleItems[currentFocusIndex].dataset.productName;
            if (productName) {
                updateProductQuantityInOrder(productName, -1);
            }
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault(); // Prevent page scrolling

            if (visibleItems.length === 0) {
                currentFocusIndex = -1;
                searchBox.focus(); // Ensure search box is focused if list is empty
                return;
            }

            // Remove keyboard-focus and focus from all items before updating
            visibleItems.forEach(item => item.classList.remove("focus", "keyboard-focus"));

            // Always clamp currentFocusIndex to -1 after search/filter
            if (document.activeElement === searchBox) {
                currentFocusIndex = -1;
            }

            if (event.key === "ArrowDown") {
                if (currentFocusIndex === -1) {
                    // From search box, move to the first visible item
                    currentFocusIndex = 0;
                    searchBox.blur(); // Unfocus search box
                } else if (currentFocusIndex < visibleItems.length - 1) {
                    // Move to the next visible item
                    currentFocusIndex++;
                }
                // Always highlight the current focused item if in range
                if (currentFocusIndex >= 0 && currentFocusIndex < visibleItems.length) {
                    visibleItems[currentFocusIndex].classList.add("focus", "keyboard-focus");
                    visibleItems[currentFocusIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
                }
            }

            if (event.key === "ArrowUp") {
                if (currentFocusIndex <= 0) {
                    // From the first item, move back to search box
                    if (visibleItems[0]) {
                        visibleItems[0].classList.remove("focus", "keyboard-focus");
                    }
                    searchBox.focus();
                    currentFocusIndex = -1;
                } else {
                    // Move to the previous visible item
                    currentFocusIndex--;
                    if (currentFocusIndex >= 0 && visibleItems[currentFocusIndex]) {
                        visibleItems[currentFocusIndex].classList.add("focus", "keyboard-focus");
                        visibleItems[currentFocusIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }
                }
            }
        }

        // Simulate click with Enter key on the currently focused list item.
        if (event.key === "Enter") {
            if (currentFocusIndex >= 0 && currentFocusIndex < visibleItems.length) {
                event.preventDefault();
                // Simulate click on the product info div, not the entire li
                const productInfoDiv = visibleItems[currentFocusIndex].querySelector('.product-info');
                if (productInfoDiv) {
                    productInfoDiv.click();
                }
            } else if (document.activeElement === searchBox) {
                // If search box is active and Enter is pressed, try to process quantity if present
                const searchInput = searchBox.value;
                const { searchTerm, quantity, isValid } = parseSearchInput(searchInput);

                if (isValid && quantity !== null) {
                    const firstVisibleProductElement = getFirstVisibleProductElement();
                    if (firstVisibleProductElement) {
                        const productName = firstVisibleProductElement.dataset.productName;
                        // Call addToOrder with the product name and desired quantity
                        addToOrder(productName, quantity);
                        searchBox.value = searchTerm; // Clear quantity from search box after processing
                        filterProductsAndDisplay(searchTerm); // Refresh the list using the new improved function
                        resetFocus(); // Reset focus after action
                    }
                }
            }
        }

    } else if (isOrderModalOpen) {
        // Keyboard navigation specific to the Order Quantity Modal (now simplified)
        // No numeric keypad to handle here
        // If Escape key is pressed, close the modal
        if (event.key === 'Escape') {
            event.preventDefault();
            // Assuming the close button has data-bs-dismiss="modal" and onclick="addToOrder()"
            // Simulating click on the close button to close the modal.
            document.querySelector('#order-modal .btn-close').click();
        }
    } else if (isOrderPopupOpen) {
        // Handle keyboard shortcuts specifically for the Order Text Popup
        if (event.key === 'Escape') {
            event.preventDefault();
            toggleOrderPopup(); // Close the popup
        } else if (event.ctrlKey && !event.shiftKey && (event.key === "o" || event.key === "O")) {
            event.preventDefault();
            toggleOrderPopup(); // Toggle the popup with Ctrl+O
        } else if (event.ctrlKey && (event.key === "c" || event.key === "C")) {
            event.preventDefault();
            copyOrder(); // Call the function to copy the order text
        } else if (event.ctrlKey && event.key === "Delete") {
            event.preventDefault();
            clearOrder(); // Call the function to clear the order
        } else if (event.ctrlKey && event.key === "Enter") {
            event.preventDefault();
            sendOrder(); // Call the function to send the order
        }
    }
    // No 'else' block for `event.preventDefault()` if a modal is open.
    // This allows default behavior within modals unless explicitly handled.
});

// Function to focus the first visible product item in the list after filtering or clearing
function focusFirstVisibleItem() {
    const productListContainer = document.getElementById("product-list");
    const visibleItems = Array.from(productListContainer.children);
    resetFocus(); // Always clear any previous focus
    if (visibleItems.length > 0) {
        currentFocusIndex = 0;
        visibleItems[0].classList.add("focus");
        // Do NOT add keyboard-focus here (only for arrow keys)
        visibleItems[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
        currentFocusIndex = -1;
    }
}

// Ensure pointer never stays on a hidden item after navigation
function validatePointerAfterListChange() {
    const productListContainer = document.getElementById("product-list");
    const visibleItems = Array.from(productListContainer.children);
    if (currentFocusIndex >= visibleItems.length) {
        resetFocus();
        if (visibleItems.length > 0) {
            currentFocusIndex = 0;
            visibleItems[0].classList.add("focus");
            visibleItems[0].scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }
}

// Listen for DOM changes to product list to validate pointer
const productListContainer = document.getElementById("product-list");
if (productListContainer) {
    const observer = new MutationObserver(() => {
        validatePointerAfterListChange();
    });
    observer.observe(productListContainer, { childList: true });
}

// In resetFocus, also remove keyboard-focus
function resetFocus() {
    const focusedItems = document.querySelectorAll('.list-group-item.focus, .list-group-item.keyboard-focus');
    focusedItems.forEach(item => {
        item.classList.remove('focus', 'keyboard-focus');
    });
    currentFocusIndex = -1;
}

// Ensure focus is reset after filtering/searching
const searchBoxInput = document.getElementById("search-box");
if (searchBoxInput) {
    searchBoxInput.addEventListener("input", function() {
        resetFocus();
        // Remove all focus and keyboard-focus classes from product list items
        const productListContainer = document.getElementById("product-list");
        if (productListContainer) {
            Array.from(productListContainer.children).forEach(item => item.classList.remove("focus", "keyboard-focus"));
        }
    });
}
