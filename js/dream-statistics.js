(function () {
    'use strict';
    var script = document.querySelector('script[data-dream-statistics]');
    if (!script || script.dataset.started) return;
    var endpoint, site;
    try {
        endpoint = new URL(script.dataset.endpoint);
        site = new URL(script.dataset.site);
    } catch (_) { return; }
    // Local previews and alternate hosts must not increment the production ledger.
    if (location.origin !== site.origin || endpoint.protocol !== 'https:') return;
    script.dataset.started = '1';
    var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    var visitor;
    try { visitor = localStorage.getItem('dream-visitor-v1'); } catch (_) { /* Storage can be unavailable. */ }
    if (!uuidPattern.test(visitor || '')) {
        visitor = crypto.randomUUID();
        try { localStorage.setItem('dream-visitor-v1', visitor); } catch (_) { /* Count without persistence. */ }
    }
    var abort = new AbortController();
    var timer = setTimeout(function () { abort.abort(); }, 8000);
    fetch(new URL('/v1/count', endpoint).href, {
        method: 'POST', credentials: 'omit', signal: abort.signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({event_id: crypto.randomUUID(), visitor_id: visitor, path: location.pathname})
    }).then(function (response) {
        if (!response.ok) throw new Error('Statistics unavailable');
        return response.json();
    }).then(function (data) {
        ['site_pv', 'site_uv', 'page_pv'].forEach(function (key) {
            if (!Number.isSafeInteger(data[key]) || data[key] < 0) throw new Error('Invalid statistics');
        });
        ['site_pv', 'site_uv', 'page_pv'].forEach(function (key) {
            var value = document.getElementById('busuanzi_value_' + key);
            var container = document.getElementById('busuanzi_container_' + key);
            if (value) { value.textContent = data[key].toLocaleString('zh-CN'); value.dataset.statisticsState = 'ready'; }
            if (container) container.style.display = 'inline';
        });
    }).catch(function () {
        ['site_pv', 'site_uv', 'page_pv'].forEach(function (key) {
            var value = document.getElementById('busuanzi_value_' + key);
            if (value) { value.textContent = '暂不可用'; value.dataset.statisticsState = 'unavailable'; }
        });
    }).finally(function () { clearTimeout(timer); });
}());
