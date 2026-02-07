// Progressive Web App (PWA) Installation Service Worker and Prompt Handling

let deferredPrompt;
let installBtn;
let iosModal;

// Check if app is already installed
const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Modern iOS/iPadOS Detection
const isIOS = () => {
    const ua = navigator.userAgent;
    // Check for iPhone, iPad, iPod
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
    // Check for iPadOS (identified as Mac but with touch points)
    const isIPadOS = ua.includes("Mac") && navigator.maxTouchPoints > 1;

    return isIOSDevice || isIPadOS;
};

function initPWA() {
    installBtn = document.getElementById('pwa-install-btn');
    iosModal = document.getElementById('ios-install-modal');

    if (!installBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isInstalled && window.innerWidth < 768) {
            showInstallButton();
        }
    });

    if (isIOS() && !isInstalled && window.innerWidth < 768) {
        showInstallButton();
    }

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        } else if (isIOS()) {
            if (typeof bootstrap !== 'undefined' && iosModal) {
                const modal = new bootstrap.Modal(iosModal);
                modal.show();
            } else {
                console.warn('Bootstrap or iOS Modal not found');
                // Fallback: alert instructions if modal fails
                alert('To install: tap the share button and select "Add to Home Screen"');
            }
        }
    });
}

function showInstallButton() {
    if (!installBtn) return;
    installBtn.style.display = 'flex';
    installBtn.classList.remove('d-none');
    installBtn.classList.add('fade-in');

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installBtn && installBtn.classList.contains('fade-in')) {
            installBtn.classList.replace('fade-in', 'fade-out');
            setTimeout(() => {
                if (installBtn) installBtn.style.display = 'none';
            }, 500);
        }
    }, 10000);
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredPrompt = null;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
} else {
    initPWA();
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(err => console.log('SW registration failed:', err));
    });
}
