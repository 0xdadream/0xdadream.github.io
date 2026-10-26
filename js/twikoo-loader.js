(function () {
    'use strict';
    var configNode = document.getElementById('twikoo-config');
    if (!configNode) return;
    var config = JSON.parse(configNode.textContent);
    var mount = document.getElementById('tcomments');
    var loader = document.getElementById('twikoo-loader');
    var status = document.getElementById('twikoo-load-status');
    var button = document.getElementById('twikoo-load-button');
    var adminStatus = document.getElementById('twikoo-admin-status');
    var observer;
    var adminPanelChecked = false;

    // 只根据已渲染的管理控件提示状态，不读取或复制登录凭据。
    function syncControls() {
        var logout = mount.querySelector('.tk-panel-logout');
        if (logout) adminPanelChecked = true;
        var isAdmin = !!logout || (!adminPanelChecked && !!mount.querySelector('.tk-comment .tk-actions'));
        if (adminStatus) adminStatus.hidden = !isAdmin;
        // 退出后上游内联按钮可能等待下一次配置刷新，先同步隐藏旧的管理控件。
        if (adminPanelChecked) mount.dataset.dreamAdmin = isAdmin ? 'yes' : 'no';
        var icons = mount.querySelectorAll('.tk-comments-actions > .tk-icon');
        var labels = icons.length === 1 ? ['评论管理'] : ['搜索评论', '刷新评论', '评论管理'];
        icons.forEach(function (icon, index) {
            if (icon.dataset.dreamAccessible) return;
            icon.dataset.dreamAccessible = 'true';
            icon.setAttribute('role', 'button');
            icon.setAttribute('tabindex', '0');
            icon.setAttribute('aria-label', labels[index]);
            icon.setAttribute('title', labels[index]);
            icon.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); icon.click(); }
            });
        });
        if (mount.dataset.status === 'ready') {
            var failed = !!mount.querySelector('.tk-error');
            loader.hidden = !failed;
            if (failed) {
                status.textContent = '评论服务暂时无法完成请求。可检查网络后重新加载，或稍后再试。';
                button.textContent = '重新加载页面';
                button.disabled = false;
            }
        }
    }
    if ('MutationObserver' in window) {
        new MutationObserver(syncControls).observe(mount, {childList: true, subtree: true});
    }

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
        if (mount.dataset.status === 'loading') return;
        if (mount.dataset.status === 'ready') {
            if (!mount.querySelector('.tk-error')) return;
            var draft = mount.querySelector('textarea');
            if (draft && draft.value.trim() && !window.confirm('评论框里还有内容。请先复制保存；确定重新加载页面吗？')) return;
            window.location.reload();
            return;
        }
        mount.dataset.status = 'loading';
        mount.setAttribute('aria-busy', 'true');
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
            syncControls();
        } catch (_) {
            mount.dataset.status = 'error';
            loader.hidden = false;
            status.textContent = '评论暂时加载失败，可以稍后重试。';
            button.textContent = '重试加载评论';
            button.disabled = false;
        } finally {
            mount.setAttribute('aria-busy', 'false');
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
