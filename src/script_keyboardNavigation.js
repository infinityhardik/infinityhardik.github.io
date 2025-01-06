// Track the currently focused index
// This Index is modified on User Input in Search Box to the First Visible item in the Product List (file: src/script_searchBox.js)
let currentFocusIndex = -1;

document.addEventListener("keydown", function (event) {
  const searchBox = document.getElementById("search-box");
  const filterModal = document.getElementById("filter-modal");
  const orderModal = document.getElementById("order-modal");

  // Check if any modal is open
  const isFilterModalOpen = filterModal.classList.contains("show");
  const isOrderModalOpen = orderModal.classList.contains("show");

  // Handle keyboard shortcuts only if no modal is open
  if (!isFilterModalOpen && !isOrderModalOpen) {

    // Ctrl + Shift + F: Open Filters Modal
    if (event.ctrlKey && event.shiftKey && (event.key === "f" || event.key === "F")) {
      event.preventDefault(); // Prevent adding "F" to the search box
      document.getElementById('filterProductList').click();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Shify=t + O : Clear Filters
    if (event.ctrlKey && event.shiftKey && (event.key === "o" || event.key === "O")) {
      event.preventDefault(); // Prevent adding "F" to the search box
      document.getElementById('clearFilters').click();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Delete: Clear Order
    if (event.ctrlKey && event.key === "Delete") {
      event.preventDefault();
      clearOrder();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Backspace: Clear Search Text
    if (event.ctrlKey && event.key === "Backspace") {
      event.preventDefault();
      document.getElementById('clearSearch').click();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Enter: Send Order
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      sendOrder();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + C: Copy Order Text
    if (event.ctrlKey && (event.key === "c" || event.key === "C")) {
      event.preventDefault();
      copyOrder();
      return; // Exit the function to avoid processing the key further
    }

    // Alphanumeric Keys: Focus and Type into the Search Box
    if (/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault(); // Prevent default typing
      const cursorPos = searchBox.selectionStart; // Get the cursor position before typing
      searchBox.focus();
      searchBox.value = searchBox.value.slice(0, cursorPos) + event.key + searchBox.value.slice(cursorPos); // Insert the character at the cursor position

      // Set the cursor position right after the newly inserted character
      searchBox.setSelectionRange(cursorPos + 1, cursorPos + 1); // Move cursor after the inserted character

      // Trigger the input event manually to update the filter
      const inputEvent = new Event('input', { bubbles: true });
      searchBox.dispatchEvent(inputEvent);
    }

    // Handle Backspace Key: Remove the last character from the search box
    if (event.key === "Backspace") {
      event.preventDefault(); // Prevent default backspace behavior
      const cursorPos = searchBox.selectionStart; // Get the cursor position
      if (cursorPos > 0) {
        searchBox.focus();
        searchBox.value = searchBox.value.slice(0, cursorPos - 1) + searchBox.value.slice(cursorPos); // Remove the character before the cursor

        // Set the cursor back to the previous position
        searchBox.setSelectionRange(cursorPos - 1, cursorPos - 1); // Move cursor one character back
      }

      resetFocus(); // Reset focus to the search box

      // Trigger the input event manually to update the filter
      const inputEvent = new Event('input', { bubbles: true });
      searchBox.dispatchEvent(inputEvent);
    }

    // Handle Delete Key: Remove the character after the cursor from the search box
    if (event.key === "Delete") {
      event.preventDefault(); // Prevent default delete behavior
      const cursorPos = searchBox.selectionStart; // Get the cursor position
      if (cursorPos < searchBox.value.length) {
        searchBox.focus();
        searchBox.value = searchBox.value.slice(0, cursorPos) + searchBox.value.slice(cursorPos + 1); // Remove character at cursor
      }

      // Set the cursor position back to the correct place
      searchBox.setSelectionRange(cursorPos, cursorPos); // Reset cursor to the correct position

      // Trigger the input event manually to update the filter
      const inputEvent = new Event('input', { bubbles: true });
      searchBox.dispatchEvent(inputEvent);
    }


    // Arrow Key Navigation Block

    const productListContainer = document.getElementById("product-list");
    const visibleItems = Array.from(productListContainer.children).filter(
      item => getComputedStyle(item).display !== "none"
    );

    // Search box and list navigation
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      // Handle ArrowDown navigation
      if (event.key === "ArrowDown") {
        if (currentFocusIndex === -1) {
          // First Down Arrow Key press focuses on the first list-group item
          currentFocusIndex = 1;
          visibleItems[0]?.classList.add("focus");
          visibleItems[0]?.scrollIntoView({ block: "nearest" });
          visibleItems[0]?.focus?.(); // Ensure it's programmatically focusable
        } else if (currentFocusIndex > 0 && currentFocusIndex <= visibleItems.length) {
          // Move focus to the next list item
          visibleItems[currentFocusIndex - 1]?.classList.remove("focus");
          if (currentFocusIndex < visibleItems.length) {
            visibleItems[currentFocusIndex]?.classList.add("focus");
            visibleItems[currentFocusIndex]?.scrollIntoView({ block: "nearest" });
          }
          currentFocusIndex++;
        }
      }

      // Handle ArrowUp navigation
      if (event.key === "ArrowUp") {
        if (currentFocusIndex === 1) {
          // Move focus back to search box
          visibleItems[0]?.classList.remove("focus");
          searchBox.focus();
          currentFocusIndex = -1; // Reset index to start at the search box
        } else if (currentFocusIndex > 1) {
          // Move focus to the previous list item
          visibleItems[currentFocusIndex - 1]?.classList.remove("focus");
          visibleItems[currentFocusIndex - 2]?.classList.add("focus");
          visibleItems[currentFocusIndex - 2]?.scrollIntoView({ block: "nearest" });
          currentFocusIndex--;
        }
      }
    }

    // Simulate click with Enter key
    if (event.key === "Enter" && currentFocusIndex > 0) {
      event.preventDefault();
      visibleItems[currentFocusIndex - 1]?.click(); // -1 because index 0 is the search box
    }

    // Arrow Key Navigation Block

  } else if (isOrderModalOpen) {
    // Any Numeric Input should appendToQuantity the Respective Number Key by clicking it
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      appendToQuantity(event.key);
    }
    // Backspace Key should clearLastDigit()
    else if (event.key === 'Backspace') {
      event.preventDefault();
      clearLastDigit();
    }
    // Delete Key should clearAllDigits() with a click
    else if (event.key === 'Delete') {
      event.preventDefault();
      document.getElementById('clearAllDigits').click();
    }
    // Enter Key should simulate addToOrder() with a click
    else if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('addToOrder').click();
    }
  }
  else {
    // Prevent any action if a modal is open
    event.preventDefault();
  }
});