/**
 * Modal - Lightweight vanilla JS modal system
 */
const Modal = {
    _escHandler: null,

    open(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        this.closeAll();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const focusable = modal.querySelector('button, input, select, textarea');
        if (focusable) setTimeout(() => focusable.focus(), 50);

        this._escHandler = (e) => {
            if (e.key === 'Escape') this.close(id);
        };
        window.addEventListener('keydown', this._escHandler);

        modal.onclick = (e) => {
            if (e.target === modal) this.close(id);
        };
    },

    close(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.classList.remove('active');

        if (!document.querySelector('.modal-overlay.active')) {
            document.body.style.overflow = '';
        }

        if (this._escHandler) {
            window.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
};
