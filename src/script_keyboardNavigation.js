// Track the currently focused index
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
    if (event.ctrlKey && event.shiftKey && event.key === "F") {
      event.preventDefault(); // Prevent adding "F" to the search box
      const modalElement = new bootstrap.Modal(filterModal);
      modalElement.show();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Alt + F: Clear Filters
    if (event.ctrlKey && event.altKey && event.key === "F") {
      event.preventDefault(); // Prevent adding "F" to the search box
      clearFilters();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Delete: Clear Order
    if (event.ctrlKey && event.key === "Delete") {
      event.preventDefault();
      clearOrder();
      return; // Exit the function to avoid processing the key further
    }

    // Ctrl + Enter: Send Order
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      sendOrder();
      return; // Exit the function to avoid processing the key further
    }

    // Alphanumeric Keys: Focus and Type into the Search Box
    if (/^[a-zA-Z0-9]$/.test(event.key)) {
      event.preventDefault(); // Prevent default typing
      searchBox.focus();
      searchBox.value += event.key; // Append the key to the search box
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

  } else {
    // Prevent any action if a modal is open
    event.preventDefault();
  }
});  