(function () {
    'use strict';
    var configNode = document.getElementById('twikoo-config');
    if (!configNode) return;
    var config = JSON.parse(configNode.textContent);
    var mount = document.getElementById('tcomments');
    var loader = document.getElementById('twikoo-loader');
    var status = document.getElementById('twikoo-load-status');
    var button = document.getElementById('twikoo-load-button');
    var observer;

    function loadScript() {
        if (window.twikoo) return Promise.resolve();
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var timer = window.setTimeout(function () {
                script.remove(); reject(new Error('Comment script timeout'));
            }, 12000);
            script.src = config.script;
            script.onload = function () { window.clearTimeout(timer); resolve(); };
            script.onerror = function () {
                window.clearTimeout(timer); script.remove(); reject(new Error('Comment script unavailable'));
            };
            document.head.appendChild(script);
        });
    }
    async function load() {
        if (mount.dataset.status === 'loading' || mount.dataset.status === 'ready') return;
        mount.dataset.status = 'loading';
        button.disabled = true;
        status.textContent = '正在加载评论…';
        if (observer) observer.disconnect();
        try {
            await loadScript();
            if (!window.twikoo || typeof window.twikoo.init !== 'function') throw new Error('Comment client unavailable');
            await window.twikoo.init(config.options);
            mount.querySelectorAll('input, textarea, select').forEach(function (input) {
                input.classList.add('browser-default');
            });
            mount.dataset.status = 'ready';
            loader.hidden = true;
        } catch (_) {
            mount.dataset.status = 'error';
            loader.hidden = false;
            status.textContent = '评论暂时加载失败，可以稍后重试。';
            button.textContent = '重试加载评论';
            button.disabled = false;
        }
    }
    button.addEventListener('click', load);
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) load();
        }, {rootMargin: '350px'});
        observer.observe(mount);
    } else { load(); }
}());
