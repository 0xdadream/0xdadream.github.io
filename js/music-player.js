(function () {
    'use strict';
    var configNode = document.getElementById('music-config');
    if (!configNode) return;
    var config = JSON.parse(configNode.textContent);
    var mount = document.getElementById('music-player');
    var feedback = document.getElementById('music-feedback');
    var message = document.getElementById('music-message');
    var retry = document.getElementById('music-retry');
    var next = document.getElementById('music-next');
    var source = document.getElementById('music-source');
    var player;
    var loading = false;
    var resettingAfterError = false;

    function sourceLink(song) {
        source.hidden = true;
        if (config.server !== 'netease') return;
        var id;
        try { id = song && new URL(song.url, location.href).searchParams.get('id'); } catch (error) { /* Use the playlist link. */ }
        source.href = 'https://music.163.com/#/' + (id ? 'song?id=' + encodeURIComponent(id) : config.type + '?id=' + encodeURIComponent(config.id));
        source.hidden = false;
    }

    function showError(text) {
        message.textContent = text;
        feedback.hidden = false;
        retry.hidden = false;
        retry.disabled = false;
        retry.textContent = '重试';
        next.hidden = !player || player.list.audios.length < 2;
        sourceLink(player && player.list.audios[player.list.index]);
    }

    function labelControls() {
        var labels = { play: '播放或暂停', back: '上一首', forward: '下一首', order: '切换播放顺序', loop: '切换循环模式', menu: '打开播放列表', lrc: '显示或隐藏歌词', 'volume-down': '调节音量' };
        Object.keys(labels).forEach(function (key) {
            mount.querySelectorAll('button.aplayer-icon-' + key).forEach(function (control) { control.setAttribute('aria-label', labels[key]); });
        });
        var switcher = mount.querySelector('.aplayer-miniswitcher button');
        if (switcher) switcher.setAttribute('aria-label', '展开或收起音乐播放器');
        var picture = mount.querySelector('.aplayer-pic');
        if (picture) {
            picture.setAttribute('role', 'button');
            picture.setAttribute('tabindex', '0');
            picture.setAttribute('aria-label', '播放或暂停');
            picture.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); picture.click(); }
            });
        }
    }

    async function load() {
        if (loading) return;
        loading = true;
        feedback.hidden = false;
        retry.disabled = true;
        message.textContent = '正在加载歌单…';
        var controller = new AbortController();
        var timeout = window.setTimeout(function () { controller.abort(); }, 12000);
        try {
            if (!window.APlayer) {
                await new Promise(function (resolve, reject) {
                    var script = document.createElement('script');
                    script.src = config.script;
                    script.onload = resolve;
                    script.onerror = reject;
                    controller.signal.addEventListener('abort', function () {
                        script.remove();
                        reject(new Error('Player load timed out'));
                    }, { once: true });
                    document.head.appendChild(script);
                });
            }
            if (!window.APlayer) throw new Error('Player unavailable');
            var api = config.api.replace(':server', encodeURIComponent(config.server)).replace(':type', encodeURIComponent(config.type)).replace(':id', encodeURIComponent(config.id)).replace(':r', String(Math.random()));
            var response = await fetch(api, { signal: controller.signal });
            if (!response.ok) throw new Error('Playlist unavailable');
            var songs = await response.json();
            if (!Array.isArray(songs) || !songs.length) throw new Error('Empty playlist');
            var audio = songs.filter(function (song) { return song && typeof song.url === 'string' && song.url; }).map(function (song) {
                return { name: song.name || song.title || '未知曲目', artist: song.artist || song.author || '', url: song.url, cover: song.cover || song.pic || '', lrc: song.lrc || '' };
            });
            if (!audio.length) throw new Error('Empty playlist');
            player = new APlayer(Object.assign({}, config.player, { container: mount, audio: audio }));
            // APlayer 1.10.1 schedules an automatic skip on error. Its documented
            // list.switch API clears that timer; preload:none keeps this reset idle.
            player.on('error', function () {
                player.pause();
                resettingAfterError = true;
                player.list.switch(player.list.index);
                resettingAfterError = false;
                player.notice('', 1);
                showError('当前歌曲暂时无法播放，音源可能失效或受限。');
            });
            player.on('listswitch', function () {
                if (!resettingAfterError) { feedback.hidden = true; player.notice('', 1); }
            });
            player.on('playing', function () { feedback.hidden = true; player.notice('', 1); });
            labelControls();
            feedback.hidden = true;
            mount.dispatchEvent(new CustomEvent('musicready'));
        } catch (error) {
            showError('歌单暂时加载失败，请稍后重试，也可前往原平台收听。');
        } finally {
            window.clearTimeout(timeout);
            loading = false;
            retry.disabled = false;
        }
    }

    retry.addEventListener('click', function () {
        if (!player) { load(); return; }
        feedback.hidden = true;
        player.list.switch(player.list.index);
        player.play();
    });
    next.addEventListener('click', function () { player.skipForward(); player.play(); });
    if (!config.lazy) load();
}());
