let deferredPrompt;
const installBtn = document.getElementById('pwa-install-btn');
const iosModal = document.getElementById('ios-install-modal');

// Check if app is already installed
const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!isInstalled && window.innerWidth < 768) {
        showInstallButton();
    }
});

function showInstallButton() {
    installBtn.style.display = 'flex';
    installBtn.classList.add('fade-in');

    // Auto-hide after 30 seconds
    setTimeout(() => {
        installBtn?.classList.replace('fade-in', 'fade-out');
        setTimeout(() => { if (installBtn) installBtn.style.display = 'none'; }, 500);
    }, 30000);
}

// iOS Detection & Handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS && !isInstalled && window.innerWidth < 768) {
    showInstallButton();
}

installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    } else if (isIOS) {
        const modal = new bootstrap.Modal(iosModal);
        modal.show();
    }
});

window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    deferredPrompt = null;
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(err => console.log('SW registration failed:', err));
    });
}
