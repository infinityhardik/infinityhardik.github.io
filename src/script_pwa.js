// Progressive Web App (PWA) Installation Prompt Handling
let deferredPrompt;
let installBtn;

const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

const isIOS = () => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
};

// The Install button springs in when it becomes available
function showInstallButton() {
    if (!installBtn.classList.contains('is-hidden')) return;
    installBtn.classList.remove('is-hidden');
    animatePopIn(installBtn);
}

function initPWA() {
    installBtn = document.getElementById('pwa-install-btn');

    if (!installBtn) return;

    const isMobile = window.innerWidth < 1024;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!isInstalled && isMobile) {
            showInstallButton();
        }
    });

    if (isIOS() && !isInstalled && isMobile) {
        showInstallButton();
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
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => {
                // A hard refresh (Ctrl+Shift+R / Ctrl+F5) loads the page without the
                // service worker, so its cache isn't updated. When an installed worker
                // isn't controlling this page, ask it to re-download the cached files,
                // so the next normal load shows this same fresh version.
                if (!navigator.serviceWorker.controller && reg.active) {
                    reg.active.postMessage('refresh-cache');
                }
            })
            .catch(err => console.warn('Service worker registration failed:', err));
    });
}
