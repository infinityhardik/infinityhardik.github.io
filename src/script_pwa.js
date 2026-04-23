// Progressive Web App (PWA) Installation Prompt Handling
let deferredPrompt;
let installBtn;

const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

const isIOS = () => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
};

function initPWA() {
    installBtn = document.getElementById('pwa-install-btn');

    if (!installBtn) return;

    const isMobile = window.innerWidth < 1024;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isInstalled && isMobile) {
            installBtn.classList.remove('is-hidden');
        }
    });

    if (isIOS() && !isInstalled && isMobile) {
        installBtn.classList.remove('is-hidden');
    }

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installBtn.classList.add('is-hidden');
            deferredPrompt = null;
        } else if (isIOS()) {
            Modal.open('ios-install-modal');
        }
    });
}

window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.classList.add('is-hidden');
    deferredPrompt = null;
});

document.addEventListener('DOMContentLoaded', initPWA);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(err => console.log('SW failed:', err));
    });
}
