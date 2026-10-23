(function () {
    'use strict';

    function initializeRevealAnimations() {
        var elements = document.querySelectorAll('[data-aos]');
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elements.forEach(function (element) {
                element.classList.add('aos-animate');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

        elements.forEach(function (element) {
            observer.observe(element);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRevealAnimations, { once: true });
    } else {
        initializeRevealAnimations();
    }
}());
