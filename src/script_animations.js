/**
 * Simplified Animations & Interactivity
 */
const animations = {
    // Optimize for reduced motion
    optimize: () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-base', '0s');
            document.documentElement.style.setProperty('--transition-fast', '0s');
        }
    },

    init: () => {
        animations.optimize();

        // Haptic feedback
        const triggerHaptic = (type = 'light') => {
            if (!navigator.vibrate) return;
            if (type === 'medium') navigator.vibrate(50);
            else navigator.vibrate(20);
        };

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .floating-btn');
            if (btn) {
                const isDestructive = btn.classList.contains('btn-danger');
                triggerHaptic(isDestructive ? 'medium' : 'light');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', animations.init);
