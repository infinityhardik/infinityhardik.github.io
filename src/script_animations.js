/**
 * Animations & Haptics
 *
 * Every animation here moves only transform/opacity (composited by the GPU — no
 * layout or repaint of the page) and uses the Web Animations API, so restarting
 * one never forces a layout. All of them are skipped when the device asks for
 * reduced motion.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function canAnimate(el) {
    return !!(el && el.animate && !reducedMotion.matches);
}

/** Quick scale "pop" — e.g. a quantity that just changed, or a badge that grew. */
function animateBump(el, scale = 1.25, duration = 220) {
    if (!canAnimate(el)) return;
    el.animate(
        [{ transform: 'scale(1)' }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }],
        { duration, easing: 'ease-out' }
    );
}

// Toasts slide in from the edge they sit at: the bottom, or the top while the
// on-screen keyboard is open (see displayFeedbackMessage)
function toastOffset() {
    return document.documentElement.classList.contains('keyboard-open') ? -16 : 16;
}

/** Toast entrance: rises and settles with a slight spring (keeps the toast's centring transform). */
function animateToastIn(el) {
    if (!canAnimate(el)) return;
    const dy = toastOffset();
    el.animate(
        [
            { opacity: 0, transform: `translateX(-50%) translateY(${dy}px) scale(0.92)` },
            { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' }
        ],
        { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
    );
}

/**
 * Toast exit: sinks back and fades, then removes the toast.
 * Returns false when not animating (the caller removes it itself).
 */
function animateToastOut(el) {
    if (!canAnimate(el)) return false;
    const dy = toastOffset();
    el.animate(
        [
            { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
            { opacity: 0, transform: `translateX(-50%) translateY(${dy / 2}px) scale(0.96)` }
        ],
        { duration: 200, easing: 'ease-in', fill: 'forwards' }
    ).onfinish = () => el.remove();
    return true;
}

/** First paint of the list: the top rows fade up in a short cascade. */
function animateListIntro(container) {
    if (!canAnimate(container)) return;
    const rows = container.children;
    for (let i = 0; i < Math.min(rows.length, 14); i++) {
        rows[i].animate(
            [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
            { duration: 320, delay: i * 22, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
        );
    }
}

/**
 * Theme switch: the new theme spreads from the toggle button in a circle.
 * The View Transitions API swaps two snapshots of the page on the GPU, so
 * nothing on the page is re-painted while it plays. Browsers without it (or
 * set to reduced motion) switch instantly.
 */
function animateThemeSwitch(button, applyTheme) {
    const root = document.documentElement;
    if (!document.startViewTransition || !button || !canAnimate(root)) {
        applyTheme();
        return;
    }
    const r = button.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(applyTheme);
    transition.ready.then(() => {
        root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 520, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
        // The sun/moon that just appeared spins into place
        const icon = button.querySelector(root.classList.contains('dark-mode') ? '.theme-icon-sun' : '.theme-icon-moon');
        if (icon) {
            icon.animate(
                [{ transform: 'rotate(-120deg) scale(0.4)', opacity: 0 }, { transform: 'none', opacity: 1 }],
                { duration: 520, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
            );
        }
    }).catch(() => { });
}

/**
 * Brief ✓ over every visible button that runs `action` (e.g. "sendOrder"),
 * confirming a send or copy wherever it was tapped from.
 */
function flashSuccess(action) {
    document.querySelectorAll(`[onclick^="${action}("]`).forEach(btn => {
        if (!btn.offsetParent) return; // hidden on this layout
        btn.classList.remove('btn-flash');
        // Restart via the animation itself (no reflow): the class is re-added next frame
        requestAnimationFrame(() => btn.classList.add('btn-flash'));
        btn.addEventListener('animationend', () => btn.classList.remove('btn-flash'), { once: true });
    });
}

/**
 * Vibration is kept for moments that matter (order sent / copied) and limited to
 * one every 600 ms — not on every tap, which felt excessive on phones.
 */
let _lastHaptic = 0;
function haptic(ms = 15) {
    if (!navigator.vibrate) return;
    // Browsers block (and log an error for) vibration before the first tap on the page
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const now = Date.now();
    if (now - _lastHaptic < 600) return;
    _lastHaptic = now;
    navigator.vibrate(ms);
}

// Filters, History and Clear Order buttons (quick-action bar, desktop bar,
// order panel and order sheet) vibrate when tapped, like Copy and Send
const HAPTIC_BUTTONS = '[onclick^="openFilterModal("], [onclick^="openOrderHistory("], [onclick^="clearOrder("]';
document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest(HAPTIC_BUTTONS)) haptic();
});

const animations = {
    // Optimize for reduced motion
    optimize: () => {
        if (reducedMotion.matches) {
            document.documentElement.style.setProperty('--transition-base', '0s');
            document.documentElement.style.setProperty('--transition-fast', '0s');
        }
    },

    init: () => {
        animations.optimize();
    }
};

document.addEventListener('DOMContentLoaded', animations.init);
