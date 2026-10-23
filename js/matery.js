$(function () {
    /**
     * 添加文章卡片hover效果.
     */
    let articleCardHover = function () {
        let animateClass = 'animated pulse';
        $('article:not(.dream-articles) .article').hover(function () {
            $(this).addClass(animateClass);
        }, function () {
            $(this).removeClass(animateClass);
        });
    };
    articleCardHover();

    /*菜单切换*/
    $('.sidenav').sidenav();

    /* 修复文章卡片 div 的宽度. */
    let fixPostCardWidth = function (srcId, targetId) {
        let srcDiv = $('#' + srcId);
        if (srcDiv.length === 0) {
            return;
        }

        let w = srcDiv.width();
        if (w >= 450) {
            w = w + 21;
        } else if (w >= 350 && w < 450) {
            w = w + 18;
        } else if (w >= 300 && w < 350) {
            w = w + 16;
        } else {
            w = w + 14;
        }
        $('#' + targetId).width(w);
    };

    /**
     * 修复footer部分的位置，使得在内容比较少时，footer也会在底部.
     */
    let fixFooterPosition = function () {
        $('.content').css('min-height', window.innerHeight - 165);
    };

    /**
     * 修复样式.
     */
    let fixStyles = function () {
        fixPostCardWidth('navContainer');
        fixPostCardWidth('artDetail', 'prenext-posts');
        fixFooterPosition();
    };
    fixStyles();

    /*调整屏幕宽度时重新设置文章列的宽度，修复小间距问题*/
    $(window).resize(function () {
        fixStyles();
    });

    /*初始化瀑布流布局*/
    if ($.fn.masonry && $('#articles:not(.dream-articles)').length) {
        $('#articles:not(.dream-articles)').masonry({
            itemSelector: '.article'
        });
    }

    if (window.AOS) {
        AOS.init({
            easing: 'ease-in-out-sine',
            duration: 700,
            delay: 100
        });
    }

    /*文章内容详情的一些初始化特性*/
    let articleInit = function () {
        $('#articleContent a[href]').each(function () {
            if (this.hasAttribute('download')) {
                return;
            }
            let linkUrl;
            try {
                linkUrl = new URL(this.getAttribute('href'), window.location.href);
            } catch (error) {
                return;
            }
            if (!/^https?:$/.test(linkUrl.protocol)) {
                return;
            }
            if (linkUrl.origin === window.location.origin) {
                this.removeAttribute('target');
                return;
            }
            this.target = '_blank';
            let rel = (this.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
            ['noopener', 'noreferrer'].forEach(function (value) {
                if (rel.indexOf(value) === -1) {
                    rel.push(value);
                }
            });
            this.setAttribute('rel', rel.join(' '));
        });

        $('#articleContent img').each(function () {
            let imgPath = $(this).attr('src');
            $(this).wrap($('<div>').addClass('img-item').attr({
                'data-src': imgPath || '',
                'data-sub-html': '.caption'
            }));
            // 图片添加阴影
            $(this).addClass("img-shadow img-margin");
            // 图片添加字幕
            let alt = $(this).attr('alt');
            let title = $(this).attr('title');
            let captionText = "";
            // 如果alt为空，title来替
            if (alt === undefined || alt === "") {
                if (title !== undefined && title !== "") {
                    captionText = title;
                }
            } else {
                captionText = alt;
            }
            // 字幕不空，添加之
            if (captionText !== "") {
                let captionDiv = document.createElement('div');
                captionDiv.className = 'caption';
                let captionEle = document.createElement('b');
                captionEle.className = 'center-caption';
                captionEle.innerText = captionText;
                captionDiv.appendChild(captionEle);
                this.insertAdjacentElement('afterend', captionDiv)
            }
        });
        if ($.fn.lightGallery && $('#articleContent, #myGallery').length) {
            $('#articleContent, #myGallery').lightGallery({
                selector: '.img-item',
            // 启用字幕
                subHtmlSelectorRelative: true
            });
        }

        // progress bar init
        const progressElement = window.document.querySelector('.progress-bar');
        if (progressElement) {
            new ScrollProgress((x, y) => {
                progressElement.style.width = y * 100 + '%';
            });
        }
    };
    articleInit();

    $('.modal').modal({
        onOpenEnd: function (modal) {
            if (modal.id === 'searchModal') {
                $('#searchInput').trigger('focus');
            }
        }
    });
    // Keep keyboard entry in the field if the dialog container regains focus.
    $('#searchModal').on('focus', function (event) {
        if (event.target === this) {
            let input = this.querySelector('#searchInput');
            if (input) {
                input.focus({ preventScroll: true });
            }
        }
    });

    /*回到顶部*/
    $('#backTop').click(function () {
        $('body,html').stop(true).animate({scrollTop: 0}, 400);
        return false;
    });

    /*监听滚动条位置*/
    let $nav = $('#headNav');
    let $backTop = $('.top-scroll');
    let backTopVisible = null;
    // 当页面处于文章中部的时候刷新页面，因为此时无滚动，所以需要判断位置,给导航加上绿色。
    showOrHideNavBg($(window).scrollTop());
    $(window).scroll(function () {
        /* 回到顶部按钮根据滚动条的位置的显示和隐藏.*/
        let scroll = $(window).scrollTop();
        showOrHideNavBg(scroll);
    });

    function showOrHideNavBg(position) {
        let showPosition = 100;
        let shouldShow = position >= showPosition;
        $nav.toggleClass('nav-transparent', !shouldShow);
        if (backTopVisible === shouldShow) {
            return;
        }
        backTopVisible = shouldShow;
        $backTop.stop(true, true);
        if (shouldShow) {
            $backTop.slideDown(300);
        } else {
            $backTop.slideUp(300);
        }
    }

    	
	$(".nav-menu>li").hover(function(){
		$(this).children('ul').stop(true,true).show();
		 $(this).addClass('nav-show').siblings('li').removeClass('nav-show');
		
	},function(){
		$(this).children('ul').stop(true,true).hide();
		$('.nav-item.nav-show').removeClass('nav-show');
	})
	
    $('.m-nav-item>a').on('click',function(){
            if ($(this).next('ul').css('display') == "none") {
                $('.m-nav-item').children('ul').slideUp(300);
                $(this).next('ul').slideDown(100);
                $(this).parent('li').addClass('m-nav-show').siblings('li').removeClass('m-nav-show');
            }else{
                $(this).next('ul').slideUp(100);
                $('.m-nav-item.m-nav-show').removeClass('m-nav-show');
            }
    });

    // 初始化加载 tooltipped.
    $('.tooltipped').tooltip();
});

//黑夜模式提醒开启功能
setTimeout(function () {
    if (!document.body.classList.contains('dream-ui') && (new Date().getHours() >= 19 || new Date().getHours() < 7) && !$('body').hasClass('DarkMode')) {
        M.toast({ text: '晚上使用深色模式阅读更好哦。(ﾟ▽ﾟ)' })
    }
}, 2200);

