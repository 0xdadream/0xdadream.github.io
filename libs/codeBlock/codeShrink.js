// Keyboard-accessible code block expand/collapse control.
$(function () {
    var $toggleButton = $('<button type="button" class="code-expand" title="收起代码" aria-label="收起代码" aria-expanded="true"><i class="fas fa-angle-up" aria-hidden="true"></i></button>');

    $('.code-area').prepend($toggleButton);
    $('.code-expand').on('click', function () {
        var $button = $(this);
        var $area = $button.parent();
        var isClosed = $area.hasClass('code-closed');
        $area.toggleClass('code-closed', !isClosed);
        $button.siblings('pre').find('code').toggle(isClosed);
        $button.attr('aria-expanded', String(isClosed));
        $button.attr('aria-label', isClosed ? '收起代码' : '展开代码');
        $button.attr('title', isClosed ? '收起代码' : '展开代码');
    });
});
