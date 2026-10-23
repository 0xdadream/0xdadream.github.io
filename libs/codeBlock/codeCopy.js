// Accessible one-click copy control for code blocks.
$(function () {
    var $copyButton = $('<button type="button" class="code_copy" title="复制代码" aria-label="复制代码"><i class="fas fa-copy" aria-hidden="true"></i></button>');
    var $notice = $('<div class="codecopy_notice" role="status" aria-live="polite"></div>');

    $('.code-area').prepend($copyButton);
    $('.code-area').prepend($notice);

    function showNotice(ctx, message) {
        $(ctx).prev('.codecopy_notice')
            .stop(true, true)
            .text(message)
            .animate({ opacity: 1, top: 30 }, 300)
            .delay(500)
            .animate({ opacity: 0, top: 0 }, 450);
    }

    function fallbackCopy(text, ctx) {
        var activeElement = document.activeElement;
        var selection = window.getSelection();
        var ranges = [];
        if (selection) {
            for (var i = 0; i < selection.rangeCount; i++) {
                ranges.push(selection.getRangeAt(i).cloneRange());
            }
        }
        // Copy outside the article so its prose attribution handler cannot alter code.
        // A textarea also works when the code block is collapsed.
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.readOnly = true;
        textarea.tabIndex = -1;
        textarea.style.cssText = 'position:fixed;top:0;left:-9999px;';
        document.body.appendChild(textarea);
        try {
            textarea.focus({ preventScroll: true });
            textarea.select();
            var copied = document.execCommand('copy');
            showNotice(ctx, copied ? '复制成功' : '复制失败，请手动选择代码复制');
        } catch (error) {
            showNotice(ctx, '复制失败');
        } finally {
            textarea.remove();
            if (activeElement && activeElement.isConnected) {
                activeElement.focus({ preventScroll: true });
            }
            if (selection) {
                selection.removeAllRanges();
                ranges.forEach(function (range) {
                    selection.addRange(range);
                });
            }
        }
    }

    $('.code-area .code_copy').on('click', function () {
        var button = this;
        var code = $(button).siblings('pre').find('code')[0];
        if (!code) {
            showNotice(button, '没有可复制的代码');
            return;
        }
        var text = code.textContent;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function () {
                showNotice(button, '复制成功');
            }).catch(function () {
                fallbackCopy(text, button);
            });
        } else {
            fallbackCopy(text, button);
        }
    });
});
