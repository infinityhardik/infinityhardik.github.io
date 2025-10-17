// Animation utility functions
const animations = {
    // Add loading class to button
    buttonLoading: (button) => {
        button.classList.add('loading');
        button.setAttribute('disabled', true);
    },

    // Remove loading class from button
    buttonLoadingDone: (button) => {
        button.classList.remove('loading');
        button.removeAttribute('disabled');
    },

    // Show skeleton loading
    showSkeletonLoading: (container, count = 5) => {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-loader';
            fragment.appendChild(skeleton);
        }
        container.appendChild(fragment);
    },

    // Remove skeleton loading
    removeSkeletonLoading: (container) => {
        const skeletons = container.querySelectorAll('.skeleton-loader');
        skeletons.forEach(skeleton => skeleton.remove());
    },

    // Initialize intersection observer for lazy loading
    initLazyLoading: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('product-item');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });

        // Observe all list items
        document.querySelectorAll('.list-group-item').forEach(item => {
            observer.observe(item);
        });
    },

    // Optimize animations based on device performance
    optimizeForDevice: () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        
        if (prefersReducedMotion || isMobile) {
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
            document.body.classList.add('reduced-motion');
        }
    },

    // Add touch feedback
    initTouchFeedback: () => {
        document.querySelectorAll('.btn, .list-group-item').forEach(element => {
            element.addEventListener('touchstart', () => {
                element.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
            });
        });
    },

    // Initialize all animations
    init: () => {
        animations.optimizeForDevice();
        animations.initLazyLoading();
        animations.initTouchFeedback();
        
        // Handle button loading states
        document.querySelectorAll('.btn').forEach(button => {
            const originalClick = button.onclick;
            button.onclick = async (e) => {
                animations.buttonLoading(button);
                if (originalClick) {
                    await originalClick(e);
                }
                animations.buttonLoadingDone(button);
            };
        });

            // Haptic feedback for important function buttons
            const importantButtonIds = [
                'filterProductList',
                'clearFilters',
                'clearOrder',
                'sendOrder',
                'darkModeToggle',
                'showSelectedOnly',
                'clearSearch',
                'helpButton',
                'copyOrder1',
                'sendOrder1',
                'clearOrder1',
                'floating-order-button'  // Added floating order button
            ];
            importantButtonIds.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        if (navigator.vibrate) {
                            navigator.vibrate([50]); // medium-strong vibration
                        }
                    });
                }
            });
    }
};

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', animations.init);