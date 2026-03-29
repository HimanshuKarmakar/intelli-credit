// ============================================
// INTELLI-CREDIT — Minimal Effects (Groww-style)
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
})();
