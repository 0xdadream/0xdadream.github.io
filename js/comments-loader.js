(function () {
    'use strict';
    var configNode = document.getElementById('comment-config');
    if (!configNode) return;
    var config = JSON.parse(configNode.textContent);
    var mount = document.getElementById('vcomments');
    var loader = document.getElementById('comment-loader');
    var status = document.getElementById('comment-load-status');
    var button = document.getElementById('comment-load-button');
    var observer;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var timer = window.setTimeout(function () { script.remove(); reject(new Error('Comment script timeout')); }, 12000);
            script.src = src;
            script.onload = function () { window.clearTimeout(timer); resolve(); };
            script.onerror = function () { window.clearTimeout(timer); script.remove(); reject(new Error('Comment script unavailable')); };
            document.head.appendChild(script);
        });
    }

    async function load() {
        if (mount.dataset.status === 'loading' || mount.dataset.status === 'ready') return;
        mount.dataset.status = 'loading';
        button.disabled = true;
        status.textContent = '正在加载评论…';
        try {
            if (!window.AV) await loadScript(config.sdk);
            if (!window.Valine) await loadScript(config.script);
            new Valine(config.options);
            mount.dataset.status = 'ready';
            if (loader.isConnected) loader.remove();
            if (observer) observer.disconnect();
        } catch (error) {
            mount.dataset.status = 'error';
            // Keep the retry entry available if initialization replaced its mount.
            if (!loader.isConnected) mount.replaceChildren(loader);
            status.textContent = '评论暂时加载失败，请稍后重试。';
            button.textContent = '重试加载评论';
            button.disabled = false;
            if (observer) observer.disconnect();
        }
    }
    button.addEventListener('click', load);
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) load();
        }, { rootMargin: '350px' });
        observer.observe(mount);
    } else {
        load();
    }
}());
