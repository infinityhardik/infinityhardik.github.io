/**
 * Animations & Haptics
 *
 * Every animation here moves only transform/opacity (composited by the GPU — no
 * layout or repaint of the page) and uses the Web Animations API, so restarting
 * one never forces a layout. All of them are skipped when the device asks for
 * reduced motion, and while the page is in the background.
 *
 * Performance rules every animation follows:
 *  - one running animation per element and purpose: a new one cancels the old
 *    (a held −/+ restarts the pop 10× a second instead of stacking 10 of them)
 *  - cascades (several elements in a row) are capped, and skipped altogether
 *    on low-end phones — feedback for a tap is always kept
 *  - nothing measures the page while it animates; FLIP reads positions once
 *    before and once after a change, then only transforms
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ≤ 2 CPU cores or ≤ 2 GB memory (where reported), or the user asked to save data
const lowPowerDevice = (navigator.hardwareConcurrency || 4) <= 2 ||
    (navigator.deviceMemory || 4) <= 2 ||
    !!(navigator.connection && navigator.connection.saveData);

const MAX_CASCADE = 12; // more rows than this start together — the rest are off-screen anyway

function canAnimate(el) {
    return !!(el && el.animate && !reducedMotion.matches && document.visibilityState !== 'hidden');
}

// Running animation per element, per purpose ("slot")
const _running = new WeakMap();

/**
 * Starts an animation on el, replacing any earlier one in the same slot.
 * @returns {Animation|null} null when not animating
 */
function motion(el, keyframes, options, slot = 'default') {
    if (!canAnimate(el)) return null;
    let slots = _running.get(el);
    if (!slots) _running.set(el, (slots = {}));
    if (slots[slot]) slots[slot].cancel();
    const animation = el.animate(keyframes, options);
    slots[slot] = animation;
    animation.onfinish = animation.oncancel = () => {
        if (slots[slot] === animation) slots[slot] = null;
    };
    return animation;
}

const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** Quick scale "pop" — e.g. a quantity that just changed, or a badge that grew. */
function animateBump(el, scale = 1.25, duration = 220) {
    motion(el,
        [{ transform: 'scale(1)' }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }],
        { duration, easing: 'ease-out' },
        'bump');
}

/** A badge or button that just appeared springs in from small. */
function animatePopIn(el) {
    motion(el,
        [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 300, easing: EASE_SPRING },
        'bump');
}

/**
 * Elements fade up one after another. Used where a few items appear at once
 * (list on first load, History, product details); only the first MAX_CASCADE
 * are staggered.
 */
function animateCascade(elements, { distance = 10, step = 22, duration = 320 } = {}) {
    if (lowPowerDevice) return;
    const count = Math.min(elements.length, MAX_CASCADE);
    for (let i = 0; i < count; i++) {
        motion(elements[i],
            [{ opacity: 0, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'none' }],
            { duration, delay: i * step, easing: EASE_OUT, fill: 'backwards' },
            'enter');
    }
}

// Toasts slide in from the edge they sit at: the bottom, or the top while the
// on-screen keyboard is open (see displayFeedbackMessage)
function toastOffset() {
    return document.documentElement.classList.contains('keyboard-open') ? -16 : 16;
}

/** Toast entrance: rises and settles with a slight spring (keeps the toast's centring transform). */
function animateToastIn(el) {
    const dy = toastOffset();
    motion(el,
        [
            { opacity: 0, transform: `translateX(-50%) translateY(${dy}px) scale(0.92)` },
            { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' }
        ],
        { duration: 320, easing: EASE_SPRING });
}

/**
 * Toast exit: sinks back and fades, then removes the toast.
 * Returns false when not animating (the caller removes it itself).
 */
function animateToastOut(el) {
    const dy = toastOffset();
    const animation = motion(el,
        [
            { opacity: 1, transform: 'translateX(-50%) translateY(0) scale(1)' },
            { opacity: 0, transform: `translateX(-50%) translateY(${dy / 2}px) scale(0.96)` }
        ],
        { duration: 200, easing: 'ease-in', fill: 'forwards' });
    if (!animation) return false;
    animation.finished.then(() => el.remove(), () => { });
    return true;
}

/** First paint of the list: the top rows fade up in a short cascade. */
function animateListIntro(container) {
    animateCascade(container.children);
}

/**
 * The list just switched to a different set of rows (Show Selected Only, an
 * order loaded from History): the rows now on top fade up, so the change reads
 * as a change of view rather than a flicker. Opacity/transform only, and only
 * the first rows — the list itself never moves.
 */
function animateRowsSwap(container) {
    if (!container || lowPowerDevice) return;
    const rows = [];
    for (const li of container.children) {
        if (!li.classList.contains('hidden')) rows.push(li);
        if (rows.length === MAX_CASCADE) break;
    }
    animateCascade(rows, { distance: 6, step: 18, duration: 240 });
}

/**
 * FLIP: lets the elements of `container` matching `selector` glide from where
 * they were to where `mutate()` puts them (e.g. History cards closing the gap
 * of a deleted order, or re-sorting). Elements are matched by data-flip-key.
 * One layout read before and one after; the movement itself is transform only.
 */
function animateFlip(container, selector, mutate) {
    if (!container || !canAnimate(container)) {
        mutate();
        return;
    }
    const before = new Map();
    container.querySelectorAll(selector).forEach(el => before.set(el.dataset.flipKey, el.getBoundingClientRect().top));

    mutate();

    const viewBottom = window.innerHeight;
    container.querySelectorAll(selector).forEach(el => {
        const oldTop = before.get(el.dataset.flipKey);
        if (oldTop === undefined) return;
        const rect = el.getBoundingClientRect();
        const dy = oldTop - rect.top;
        // Skip elements that didn't move or are off-screen both before and after
        if (Math.abs(dy) < 1 || (rect.top > viewBottom && oldTop > viewBottom)) return;
        motion(el,
            [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
            { duration: 280, easing: EASE_OUT },
            'move');
    });
}

/**
 * An element leaves: fades and slides aside, then `done` runs (which removes
 * or re-renders it). Without animation `done` runs at once.
 */
function animateLeave(el, done) {
    const animation = motion(el,
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px) scale(0.98)' }],
        { duration: 180, easing: 'ease-in', fill: 'forwards' },
        'leave');
    if (!animation) {
        done();
        return;
    }
    // Cancelled right after `done` (same task, so nothing is painted in between):
    // an element that stays in the page must not be left invisible
    const finish = () => { done(); animation.cancel(); };
    animation.finished.then(finish, finish);
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
        motion(icon,
            [{ transform: 'rotate(-120deg) scale(0.4)', opacity: 0 }, { transform: 'none', opacity: 1 }],
            { duration: 520, easing: EASE_SPRING });
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

// Reduced motion also zeroes the CSS transition tokens (style.css covers the rest)
document.addEventListener('DOMContentLoaded', () => {
    if (!reducedMotion.matches) return;
    document.documentElement.style.setProperty('--transition-base', '0s');
    document.documentElement.style.setProperty('--transition-fast', '0s');
});
