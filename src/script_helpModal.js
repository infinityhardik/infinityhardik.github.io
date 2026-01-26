// Lazy load help modal content on first open
let helpModalLoaded = false;

/**
 * Loads the help modal content on demand
 */
async function loadHelpModal() {
    if (helpModalLoaded) return;

    try {
        const response = await fetch('assets/help-modal-content.html');
        if (!response.ok) {
            throw new Error(`Failed to load help modal: ${response.status}`);
        }

        const content = await response.text();
        const helpModalContent = document.querySelector('#help-modal .modal-content');

        if (helpModalContent) {
            helpModalContent.innerHTML = content;
            helpModalLoaded = true;
        }
    } catch (error) {
        console.error('Error loading help modal:', error);
        // Fallback: show a simple error message
        const helpModalContent = document.querySelector('#help-modal .modal-content');
        if (helpModalContent) {
            helpModalContent.innerHTML = `
                <div class="modal-header">
                    <h5 class="modal-title">Help</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Unable to load help content. Please refresh the page and try again.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            `;
        }
    }
}

// Listen for help modal show event
document.addEventListener('DOMContentLoaded', () => {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.addEventListener('show.bs.modal', loadHelpModal);
    }
});
