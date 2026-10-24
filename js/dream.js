(function () {
    'use strict';
    var body = document.body;
    if (!body.classList.contains('dream-ui')) return;

    // Match both desktop and mobile navigation without hard-coding a site root.
    var currentPath = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    var inHomeCollection = !!document.querySelector('[data-dream-home]');
    var homePath = document.querySelector('header .brand-logo a').pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
    document.querySelectorAll('header a[href]').forEach(function (link) {
        var target;
        try { target = new URL(link.href, location.href); } catch (error) { return; }
        if (target.origin !== location.origin || target.hash) return;
        var targetPath = target.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
        if (currentPath === targetPath || (targetPath && currentPath.indexOf(targetPath + '/') === 0) ||
                (inHomeCollection && targetPath === homePath)) {
            link.setAttribute('aria-current', currentPath === targetPath ? 'page' : 'location');
        }
    });

    // Chart canvases keep their old size unless ECharts is told to resize.
    var chartRoots = document.querySelectorAll('#post-calendar, #posts-chart, #categories-chart, #tags-chart, #category-radar');
    if (chartRoots.length) {
        var chartFramePending = false;
        function resizeCharts() {
            if (chartFramePending) return;
            chartFramePending = true;
            requestAnimationFrame(function () {
                chartFramePending = false;
                if (!window.echarts) return;
                chartRoots.forEach(function (element) {
                    var chart = window.echarts.getInstanceByDom(element);
                    if (chart) chart.resize({ silent: true });
                });
            });
        }
        chartRoots.forEach(function (element) {
            if (element.id === 'post-calendar') {
                var viewport = element.parentElement;
                viewport.setAttribute('tabindex', '0');
                viewport.setAttribute('role', 'region');
                viewport.setAttribute('aria-label', '文章日历，横向滚动查看完整年份');
            }
        });
        window.addEventListener('resize', resizeCharts, { passive: true });
        window.addEventListener('load', resizeCharts, { once: true });
        if (window.ResizeObserver) {
            var chartObserver = new ResizeObserver(resizeCharts);
            chartRoots.forEach(function (element) { chartObserver.observe(element); });
        }
        resizeCharts();
    }

    var reader = document.querySelector('[data-dream-reader]');
    var article = document.getElementById('articleContent');
    if (!reader || !article) return;
    var settings = { font: 18, focus: false };
    var storageKey = 'dream-reader-v1';
    try {
        var saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && [16, 18, 20, 22].indexOf(saved.font) !== -1) settings.font = saved.font;
        if (saved && typeof saved.focus === 'boolean') settings.focus = saved.focus;
    } catch (error) { /* Reading remains available when storage is blocked. */ }

    var fontOutput = document.getElementById('dream-font-size');
    var progressOutput = document.getElementById('dream-reading-progress');
    progressOutput.setAttribute('aria-live', 'off');
    var smaller = reader.querySelector('[data-reader-action="smaller"]');
    var larger = reader.querySelector('[data-reader-action="larger"]');
    var focus = reader.querySelector('[data-reader-action="focus"]');
    var panels = reader.querySelectorAll('details');
    var mobileToc = reader.querySelector('.dream-mobile-toc');
    var currentSection = null;
    var mobileSections = mobileToc ? Array.from(mobileToc.querySelectorAll('a[href]')).map(function (link) {
        var heading;
        try { heading = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch (error) { return null; }
        return heading && article.contains(heading) ? { link: link, heading: heading } : null;
    }).filter(Boolean) : [];
    function readingLine() {
        return Math.max(96, Math.min(150, reader.getBoundingClientRect().bottom + 16));
    }
    function updateCurrentSection() {
        var low = 0, high = mobileSections.length - 1, match = null;
        // Match the 150px native heading offset, including an exact anchor jump.
        var line = 150;
        while (low <= high) {
            var middle = Math.floor((low + high) / 2);
            if (mobileSections[middle].heading.getBoundingClientRect().top <= line + 2) {
                match = mobileSections[middle];
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }
        if (match !== currentSection) {
            if (currentSection) currentSection.link.removeAttribute('aria-current');
            currentSection = match;
            if (currentSection) currentSection.link.setAttribute('aria-current', 'location');
        }
    }
    function revealCurrentSection() {
        if (!mobileToc || !mobileToc.open) return;
        updateCurrentSection();
        if (!currentSection) return;
        var nav = mobileToc.querySelector('nav');
        var viewport = nav.getBoundingClientRect();
        var target = currentSection.link.getBoundingClientRect();
        // Scroll only the directory panel, preserving the article's reading position.
        if (target.top < viewport.top) nav.scrollTop += target.top - viewport.top;
        else if (target.bottom > viewport.bottom) nav.scrollTop += target.bottom - viewport.bottom;
    }
    function applySettings() {
        body.style.setProperty('--dream-reading-font', settings.font + 'px');
        body.classList.toggle('dream-focus', settings.focus);
        fontOutput.textContent = settings.font + 'px';
        smaller.disabled = settings.font === 16;
        larger.disabled = settings.font === 22;
        focus.setAttribute('aria-pressed', String(settings.focus));
        focus.textContent = settings.focus ? '退出专注阅读' : '专注阅读';
    }
    applySettings();
    reader.setAttribute('data-reader-ready', '');
    body.classList.add('dream-reader-ready');
    reader.addEventListener('click', function (event) {
        var control = event.target.closest('[data-reader-action]');
        if (!control) return;
        var action = control.dataset.readerAction;
        if (action === 'smaller') settings.font = Math.max(16, settings.font - 2);
        if (action === 'larger') settings.font = Math.min(22, settings.font + 2);
        if (action === 'focus') settings.focus = !settings.focus;
        applySettings();
        try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch (error) { /* No persistence required. */ }
        if (action === 'focus') window.dispatchEvent(new Event('resize'));
        scheduleProgress();
    });
    panels.forEach(function (panel) {
        panel.addEventListener('toggle', function () {
            if (panel.open) panels.forEach(function (other) { if (other !== panel) other.open = false; });
            if (panel === mobileToc && panel.open) requestAnimationFrame(revealCurrentSection);
        });
    });
    document.addEventListener('pointerdown', function (event) {
        panels.forEach(function (panel) {
            if (panel.open && !panel.contains(event.target)) panel.open = false;
        });
    });
    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        panels.forEach(function (panel) {
            if (panel.open) {
                panel.open = false;
                panel.querySelector('summary').focus();
            }
        });
    });
    if (mobileToc) mobileToc.addEventListener('click', function (event) {
        var link = event.target.closest('a[href]');
        if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        var heading;
        try { heading = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch (error) { return; }
        if (!heading || !article.contains(heading)) return;
        mobileToc.open = false;
        // Keep native fragment navigation and move keyboard focus out of the closed menu.
        requestAnimationFrame(function () {
            var temporaryFocus = !heading.hasAttribute('tabindex');
            if (temporaryFocus) heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
            if (temporaryFocus) heading.addEventListener('blur', function () { heading.removeAttribute('tabindex'); }, { once: true });
        });
    });

    var scheduled = false;
    function updateProgress() {
        scheduled = false;
        var rect = article.getBoundingClientRect();
        var line = readingLine();
        var distance = Math.max(1, rect.height - window.innerHeight + line);
        var progress = rect.bottom <= window.innerHeight ? 100 : Math.max(0, Math.min(100, Math.round((line - rect.top) / distance * 100)));
        progressOutput.textContent = progress + '%';
        reader.style.setProperty('--dream-reading-progress', String(progress / 100));
        updateCurrentSection();
    }
    function scheduleProgress() {
        if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
    }
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress, { passive: true });
    window.addEventListener('load', scheduleProgress, { once: true });
    if (window.ResizeObserver) new ResizeObserver(scheduleProgress).observe(article);
    scheduleProgress();
}());
