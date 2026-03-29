// ============================================
// INTELLI-CREDIT — Enhanced Effects & Utilities
// Toast, Loading, Ripple, Sidebar, Confetti
// ============================================

(function () {
    // --- Animated Number Counter ---
    window.animateNumber = function (element, target, duration) {
        const start = 0;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * eased);
            element.textContent = current;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    };

    // --- Smooth Scroll ---
    window.smoothScrollTo = function (elementId) {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // =============================================
    // TOAST NOTIFICATIONS
    // =============================================
    window.showToast = function (message, type = 'info', duration = 3500) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
        `;

        container.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    };

    // =============================================
    // LOADING OVERLAY
    // =============================================
    window.showLoading = function (text = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        if (overlay) {
            if (textEl) textEl.textContent = text;
            overlay.classList.add('active');
        }
    };

    window.hideLoading = function () {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    // =============================================
    // MOBILE SIDEBAR TOGGLE
    // =============================================
    window.toggleMobileSidebar = function () {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        if (overlay) {
            overlay.classList.toggle('active');
        }
    };

    // =============================================
    // BUTTON RIPPLE EFFECT
    // =============================================
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2;

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = `
            left: ${x - size / 2}px;
            top: ${y - size / 2}px;
            width: ${size}px;
            height: ${size}px;
        `;

        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });

    // =============================================
    // CONFETTI EFFECT (for Approve decisions)
    // =============================================
    window.showConfetti = function () {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#5367ff', '#00d09c', '#f5a623', '#eb5757', '#7b8cff', '#00e6a8'];

        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 1 + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 4000);
    };

    // =============================================
    // DEBOUNCE UTILITY
    // =============================================
    window.debounce = function (fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    // =============================================
    // INTERSECTION OBSERVER (Stagger on scroll)
    // =============================================
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('stagger-item');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        window.observeStagger = function (selector) {
            document.querySelectorAll(selector).forEach(el => obs.observe(el));
        };
    } else {
        window.observeStagger = function () { };
    }

})();
