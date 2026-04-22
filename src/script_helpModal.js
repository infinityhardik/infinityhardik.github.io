/**
 * Help Modal — loads content on first open, handles language tabs.
 */
let _helpLoaded = false;

async function openHelpModal() {
    Modal.open('help-modal');
    if (_helpLoaded) return;

    try {
        const res = await fetch('assets/help-modal-content.html');
        if (!res.ok) throw new Error('Failed to load');
        const html = await res.text();
        const body = document.getElementById('help-content');
        if (body) {
            body.innerHTML = html;
            _helpLoaded = true;
            initHelpTabs();
        }
    } catch (e) {
        const body = document.getElementById('help-content');
        if (body) body.innerHTML = '<p style="padding:16px;color:var(--color-danger)">Unable to load help content.</p>';
    }
}

function initHelpTabs() {
    const tabs = document.querySelectorAll('.help-tab-btn');
    const sections = document.querySelectorAll('.help-section');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.style.display = 'none');
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.target);
            if (target) target.style.display = 'block';
        });
    });
}
