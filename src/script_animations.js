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

/** Toast entrance: slide up and fade in (keeps the toast's centring transform). */
function animateToastIn(el) {
    if (!canAnimate(el)) return;
    el.animate(
        [
            { opacity: 0, transform: 'translateX(-50%) translateY(12px)' },
            { opacity: 1, transform: 'translateX(-50%) translateY(0)' }
        ],
        { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
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
