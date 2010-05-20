/** TODO:
 * показ окошкa с индикатором загрузки сразу после клика
**/
var loaded = false,
    $dictBox,
    lastHitPosition = [0, 0],
    selection = '',
    settings =  {
        theme: "blue",
        shortcutModifier: "alt",
        shortcutKey: 76,
        maxWidth: 0,
        maxHeight: 0
    },
    themes = {
        "blue": {
            bgColor: "#D2DCE5",
            borderColor: "#70767A"
        },
        "red": {
            bgColor: "#C52423",
            borderColor: "#7A7170"
        }
    }
;

function load() {
    loaded = true;
    chrome.extension.sendRequest({ "action": "load" }, onLoad);
}

function onLoad(options) {
    $.extend(settings, options);
    settings.bgColor = themes[settings.theme]['bgColor'];
    settings.borderColor = themes[settings.theme]['borderColor'];

    $dictBox = $('<div>', {
        "id": "dictionary_box",
        "style": {
            "display": "none",
        }
    });

    $dictBox.click(function(e) {
        e.stopPropagation();
    });

    $(document).click(function() {
        if ($dictBox.is(':visible')) $dictBox.hide();
    });

    $dictBox.draggable({cancel: '.lol-cards'});
    $('body').append($dictBox);
    chrome.extension.sendRequest({ "action" : "getTranslation", "needle" : selection }, onGetTranslation);
}

function onGetTranslation(data) {
    var start = data.indexOf('div class="lol-cards"') - 1;
    if (start != -2) {
        var end = data.indexOf('div class="rdiv-b1"', start) - 1;
        data = data.substr(start, end - start);
        var $tmp = $('<div>' + data);
        $('.soundAll', $tmp).remove();
        $('img', $tmp).each(function() {
            $(this).attr('src', function() {
                return 'http://lingvo.abbyyonline.com' + $(this).attr('src');
            });
        });
        // TODO: кешировать селектор и ссылку на изображение?
        $('a', $tmp).each(function() {
            if ($(this).hasClass('short') || $(this).attr('title') == 'Free Trial') {
                $(this).remove();
            } else {
                $(this).attr('href', function() {
                    var href = $(this).attr('href');
                    if (href.charAt(0) == '/')
                        href = 'http://lingvo.abbyyonline.com' + href;
                    return href;
                });
                $(this).removeAttr('onclick');
                $(this).css({"background-image": "url('" + chrome.extension.getURL('img/external_link.png') + "')"});
            }
        });
    } else {
        var $tmp = $('<div><div id="lol-cards">' + chrome.i18n.getMessage('noMatches') + '</div></div>');
    }
    $dictBox.empty();
    $dictBox.append($tmp);
    var maxWidth = parseInt(settings.maxWidth);
    if (maxWidth)
        $('.lol-cards', $dictBox).css({"max-width": maxWidth, "overflow": "auto"});
    var maxHeight = parseInt(settings.maxHeight);
    if (maxHeight) {
        $('.lol-cards', $dictBox).css({"max-height": maxHeight, "overflow": "auto"});
    }
    $dictBox.css({
        "position": "absolute",
        "background-color": settings.bgColor,
        "-webkit-box-shadow": "0 0 5px #888",
        "-webkit-border-radius": "5px",
        "padding": "20px 10px 10px 10px",
        "border": "1px solid" + settings.borderColor,
        "z-index": "32767"
    });
    
    if (lastHitPosition[0]) {
        $dictBox.css('left', lastHitPosition[0]);
        $dictBox.css('top', lastHitPosition[1] + 12);
    } else {
        $dictBox.css('left', $(window).width() / 2 - $dictBox.width() / 2);
        $dictBox.css('top', $(window).scrollTop() + $(window).height() / 2  - $dictBox.height() / 2);
    }
    $dictBox.show();
}

function onDblClick(e) {
    if (e.ctrlKey) {
        selection = String(window.getSelection());
        selection = selection.replace(/^\s+|\s+$/g, '');
        if (selection != '') {
            lastHitPosition[0] = e.pageX;
            lastHitPosition[1] = e.pageY;
            if (loaded)
                chrome.extension.sendRequest({ "action" : "getTranslation", "needle" : selection }, onGetTranslation);
            else
                load();
        }
    }
}

function checkModifier(e, modifier) {
    if (modifier == 'alt')
        return e.altKey;
    else if (modifier == 'ctrl')
        return e.ctrlKey;
    else if (modifier == 'shift')
        return e.shiftKey;
    return false;
}

function onKeyDown(e) {
    if (checkModifier(e, settings.shortcutModifier) && e.keyCode == settings.shortcutKey) {
        selection = String(window.getSelection());
        selection = selection.replace(/^\s+|\s+$/g, '');
        if (selection != '') {
            lastHitPosition[0] = 0;
            lastHitPosition[1] = 0;
            if (loaded) {
                chrome.extension.sendRequest({
                    "action" : "getTranslation",
                    "needle" : selection
                }, onGetTranslation);
            } else {
                load();
            }
        }
    }
}

function initialize() {
    chrome.extension.sendRequest({ "action" : "getOptions" }, function(options) {
        if (options['shortcutKey'] != undefined)
            settings.shortcutKey = options['shortcutKey'];
        if (options['shortcutModifier'] != undefined)
            settings.shortcutModifier = options['shortcutModifier'];
        window.addEventListener('dblclick', onDblClick, false);
        window.addEventListener('keydown', onKeyDown, false);
    });
}

initialize();
