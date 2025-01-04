document.addEventListener("keydown", function (event) {
    const searchBox = document.getElementById("search-box");
    const filterModal = document.getElementById("filter-modal");
  
    // Check if any modal is open
    const isModalOpen = filterModal.classList.contains("show");
  
    // Handle keyboard shortcuts only if no modal is open
    if (!isModalOpen) {
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
    } else {
      // Prevent any action if a modal is open
      event.preventDefault();
    }
  });  