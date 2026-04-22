/**
 * Simplified Animations & Interactivity
 */
const animations = {
    // Add touch feedback (using passive listeners for performance)
    initTouchFeedback: () => {
        const touchOptions = { passive: true };
        document.querySelectorAll('.btn, .product-item, .floating-btn').forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.opacity = '0.7';
            }, touchOptions);
            element.addEventListener('touchend', () => {
                element.style.opacity = '1';
            }, touchOptions);
        });
    },

    // Initialize intersection observer for lazy-in animations
    initLazyIn: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideUp 0.4s ease forwards';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.product-item').forEach(item => {
            item.style.opacity = '0';
            observer.observe(item);
        });
    },

    // Optimize for reduced motion
    optimize: () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--transition-base', '0s');
            document.documentElement.style.setProperty('--transition-fast', '0s');
        }
    },

    init: () => {
        animations.optimize();
        animations.initTouchFeedback();
        // Delay lazy-in to allow products to load
        setTimeout(animations.initLazyIn, 1000);

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