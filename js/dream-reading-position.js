(function () {
    'use strict';
    var article = document.getElementById('articleContent');
    var notice = document.querySelector('[data-reading-position]');
    if (!article || !notice) return;
    var key = 'dream-reading-position-v1';
    var path = location.pathname.replace(/\/index\.html$/, '/');
    var headings = Array.from(article.querySelectorAll('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]'));
    var line = 150, dirty = false, timer;
    function read() {
        try {
            var raw = localStorage.getItem(key);
            if (!raw || raw.length > 200000) return [];
            var rows = JSON.parse(raw);
            if (!Array.isArray(rows)) return [];
            return rows.filter(function (row) {
                return row && typeof row.path === 'string' && row.path.length <= 2000 &&
                    typeof row.heading === 'string' && row.heading.length <= 1000 &&
                    Number.isFinite(row.fraction) && row.fraction >= 0 && row.fraction <= 1 &&
                    Number.isFinite(row.progress) && row.progress > 0.03 && row.progress < 0.97 &&
                    Number.isFinite(row.savedAt) && row.savedAt <= Date.now() && Date.now() - row.savedAt < 30 * 86400000;
            }).sort(function (a, b) { return b.savedAt - a.savedAt; }).slice(0, 40);
        } catch (_) { return []; }
    }
    function write(record) {
        try {
            var rows = read().filter(function (row) { return row.path !== path; });
            if (record) rows.unshift(record);
            localStorage.setItem(key, JSON.stringify(rows.slice(0, 40)));
        } catch (_) { /* 阅读不依赖浏览器存储。 */ }
    }
    function progress() {
        var rect = article.getBoundingClientRect();
        return rect.bottom <= window.innerHeight ? 1 : Math.max(0, Math.min(1, (line - rect.top) / Math.max(1, rect.height - window.innerHeight + line)));
    }
    var saved = read().find(function (row) { return row.path === path; });
    if (saved && !location.hash) {
        notice.querySelector('span').textContent = '上次读到 ' + Math.round(saved.progress * 100) + '%';
        notice.hidden = false;
    }
    // 只在主动点击后继续阅读；带章节链接和浏览器恢复的位置优先。
    notice.querySelector('[data-reading-resume]').addEventListener('click', function () {
        if (!saved) return;
        notice.hidden = true;
        var rect = article.getBoundingClientRect();
        var target = rect.top + window.scrollY - line + saved.progress * Math.max(1, rect.height - window.innerHeight + line);
        var heading = headings.find(function (item) { return item.id === saved.heading; });
        if (heading) {
            var index = headings.indexOf(heading);
            var start = heading.getBoundingClientRect().top;
            var end = headings[index + 1] ? headings[index + 1].getBoundingClientRect().top : rect.bottom;
            target = start + window.scrollY - line + saved.fraction * Math.max(1, end - start);
        }
        window.scrollTo({top: Math.max(0, target), behavior: 'auto'});
        // 把键盘焦点移出已隐藏的按钮，正文继续支持 Tab 导航。
        article.focus({preventScroll: true});
    });
    notice.querySelector('[data-reading-forget]').addEventListener('click', function () {
        window.clearTimeout(timer);timer = null;dirty = false;saved = null;write(null);notice.hidden = true;
        article.focus({preventScroll: true});
    });
    function save() {
        window.clearTimeout(timer);timer = null;
        if (!dirty) return;
        dirty = false;
        var value = progress();
        // 回访者滚动到提示处时仍在正文开头，保留尚未处理的续读位置。
        if (value <= 0.03 && saved && !notice.hidden) return;
        if (value > 0.03) notice.hidden = true;
        if (value <= 0.03 || value >= 0.97) { write(null); return; }
        var rect = article.getBoundingClientRect(), heading;
        for (var i = 0; i < headings.length; i++) {
            if (headings[i].getBoundingClientRect().top <= line) heading = headings[i];
            else break;
        }
        var start = heading ? heading.getBoundingClientRect().top : rect.top;
        var index = headings.indexOf(heading);
        var end = heading && headings[index + 1] ? headings[index + 1].getBoundingClientRect().top : rect.bottom;
        write({path: path, heading: heading ? heading.id : '', fraction: Math.max(0, Math.min(1, (line - start) / Math.max(1, end - start))), progress: value, savedAt: Date.now()});
    }
    window.addEventListener('scroll', function () {
        dirty = true;
        if (!timer) timer = window.setTimeout(save, 1000);
    }, {passive: true});
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
    window.addEventListener('load', function () { if (progress() > 0.03) notice.hidden = true; }, {once: true});
    window.addEventListener('pageshow', function (event) { if (event.persisted) notice.hidden = true; });
}());
