document.addEventListener('keydown', (event) => {
    const searchBox = document.getElementById('search-box');
    const orderModal = document.getElementById('order-modal');
    const quantityInput = document.getElementById('quantity');

    // Open shortcuts modal
    if ((event.key === '?' || (event.ctrlKey && event.key === '/')) && !orderModal.classList.contains('show')) {
        event.preventDefault();
        openShortcutsModal();
    }

    // Focus search box on alphanumeric input and Backspace
    if (/^[a-zA-Z0-9]$/.test(event.key) || event.key === 'Backspace' && !orderModal.classList.contains('show')) {
        searchBox.focus();
    }

    // Send order on Ctrl + Enter
    if (event.ctrlKey && event.key === 'Enter') {
        sendOrder();
    }

    // Clear order on Delete key
    if (event.ctrlKey && event.key === 'Delete') {
        clearOrder();
    }

    // Handle numeric input in order modal
    if (orderModal.classList.contains('show') && /^[0-9]$/.test(event.key)) {
        appendToQuantity(event.key);
    }
});

function openShortcutsModal() {
    const shortcutsModal = new bootstrap.Modal(document.getElementById('shortcuts-modal'));
    shortcutsModal.show();
}