/**************************************************************
 * jQuery Bootstrap Multi-Select
 * Author: Nathan Fiscus
 * Date: May 6, 2015
 * Version: 2.0
 * ************************************************************/

'use strict';

//Case Insensitive Contains Selector
jQuery.expr[":"].icontains = jQuery.expr.createPseudo(function (arg) {
    return function (elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

(function ($) {
    var defaultOptions = {
        width:"auto",
        noneSelectedText: 'Nothing selected',
        noneResultsText: 'No results match',
        actionsBox: true,
        searchInsensitive: true,
        liveSearch: true,
        countSelectedText: function (numSelected, numTotal) {
            return (numSelected == 1) ? "{0} item selected" : "{0} of {1} items selected";
        },
        autoHeight: true,
        keepSearchFocus: false,
        buttonWidth: 'normal',
        showCaret: true,
        pullLeft: false
    };

    var methods = {
        init: function (options) { },
        updateItems: function (json){},
        destroy: function(){}
    };

    var  htmlEscape = function(html) {
        var escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        var source = '(?:' + Object.keys(escapeMap).join('|') + ')',
            testRegexp = new RegExp(source),
            replaceRegexp = new RegExp(source, 'g'),
            string = html == null ? '' : '' + html;
        return testRegexp.test(string) ? string.replace(replaceRegexp, function (match) {
            return escapeMap[match];
        }) : string;
    };

    //jQuery Plugin Definition
    $.fn.multiselect = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.multiselect');
        }
    };

    //Global Items array
    $.fn.multiselect.items = [];



    //Object Initialization
    methods.init = function (_options) {
        var options = $.extend({}, defaultOptions, _options);
        return this.each(function () {
            var $me = $(this);

            $me.data("multiselect-options",options);
            $me.data("multiselect-data",{selected:0,total:0});

            var title = "";
            var totalSelectedItemCount = 0;
            var totalItemCount = 0;
            var searchbox = options.liveSearch ? '<div class="bms-searchbox" style=""><input type="text" class="input-block-level form-control" autocomplete="off" style="margin-bottom: 0px;"/></div>' : '';
            var actionsbox = options.actionsBox ? '<div class="bms-actionsbox">' +
                                                    '<div class="btn-group btn-block">' +
                                                    '<button class="actions-btn bms-select-all btn btn-sm btn-default">' +
                                                    'Select All' +
                                                    '</button>' +
                                                    '<button class="actions-btn bms-deselect-all btn btn-sm btn-default">' +
                                                    'Unselect All' +
                                                    '</button>' +
                                                    '</div>' +
                                                    '</div>' : '';
            var btn = '<button class="compatibilitySelectButton btn-multiselect btn-default dropdown-toggle btn" data-toggle="dropdown"  data-multiselect="'+ $me.attr('id') + '" data-status="closed" data-toggle="dropdown">';
            if (options.showCaret)
                btn += '<span class="caret"></span>';
            btn += '</button>';

            $me.addClass("dropdown-menu")
                .attr("role","menu")
                .prepend(actionsbox)
                .prepend(searchbox)
                .wrap('<div style="width:100%;"></div>').parent()
                .prepend(btn)
                .addClass("btn-group")
                .addClass("multiselect-container");

            var $btn = $('.btn-multiselect[data-multiselect="'+ $me.attr('id') + '"]');
            var $container = $btn.parent();

            $container.data("multiselect",$me.attr('id'));
            $btn.clicked = false;

            //Create Item Array
            var arr = [];
            $me.data("multiselect-id",$.fn.multiselect.items.length);
            $me.children('li').each(function(index){
                var $t = $(this);
                var $chk = $('input[type="checkbox"]',$t);
                var obj = {text: $t.text(),value: $chk.attr('value'), checked: $chk.is(':checked')};
                $t.data('ms-index',index);
                arr.push(obj);
                if($chk.is(':checked')){
                    totalSelectedItemCount++;
                }
                totalItemCount++;
            });
            $.fn.multiselect.items.push(arr);

            if (totalItemCount == 0) {
                $button.css("min-height", "32px");
                $button.attr('disabled', true);
                title = "No Options Available";
                if (options.showCaret)
                    title += '<span class="caret"></span>';
                $button.html(title);
            }

            if (totalSelectedItemCount > 0) {
                var tr8nText = (typeof options.countSelectedText === 'function') ? options.countSelectedText(totalSelectedItemCount, totalItemCount) : options.countSelectedText;
                title = tr8nText.replace('{0}', totalSelectedItemCount.toString()).replace('{1}', totalItemCount.toString());
            } else {
                title = options.noneSelectedText;
            }
            //title = htmlEscape(title);
            if (options.showCaret)
                title += '<span class="caret"></span>';
            $btn.html(title);

            $me.data("multiselect-data",{selected:totalSelectedItemCount,total:totalItemCount});

            $btn.on("click", function(e){
                $btn.clicked = true;
                if($btn.data("status") == "closed"){
                    $me.trigger("multiselect.open");
                    $btn.data("status","opened");
                }else{
                    $me.trigger("multiselect.close");
                    $btn.data("status","closed");
                }
            });

            $me.on("click",function(e){
                e.preventDefault();
                e.stopPropagation();
            });

            $me.on("click",'li input[type="checkbox"]',function(e) {
                e.stopPropagation();
            });

            $me.on("click", "li", function(e){
                e.preventDefault();
                e.stopPropagation();

                totalSelectedItemCount = $me.data("multiselect-data").selected;
                totalItemCount = $me.data("multiselect-data").total;

                var $t = $(this);
                var $chk = $('input[type="checkbox"]',$t);
                var dropID = parseInt($me.data("multiselect-id"));
                var itemIndex = parseInt($t.data("ms-index"));
                $.fn.multiselect.items[dropID][itemIndex].checked = !$.fn.multiselect.items[dropID][itemIndex].checked;
                if($.fn.multiselect.items[dropID][itemIndex].checked){
                    totalSelectedItemCount++;
                }else{
                    totalSelectedItemCount--;
                }
                $chk.trigger("click");

                if (options.liveSearch && options.keepSearchFocus){
                    $('input[type="text"]', $me).focus();
                }
                //Update Title
                if (totalSelectedItemCount > 0) {
                    var tr8nText = (typeof options.countSelectedText === 'function') ? options.countSelectedText(totalSelectedItemCount, totalItemCount) : options.countSelectedText;
                    title = tr8nText.replace('{0}', totalSelectedItemCount.toString()).replace('{1}', totalItemCount.toString());
                } else {
                    title = options.noneSelectedText;
                }
                //title = htmlEscape(title);
                if (options.showCaret) {
                    title += '<span class="caret"></span>';
                }
                $btn.html(title);

                $me.data("multiselect-data",{selected:totalSelectedItemCount,total:totalItemCount});
            });


            if(!$.fn.multiselect._closers){
                $.fn.multiselect._closers = [];
            }

            $.fn.multiselect._closers.push(
                function(e){
                    if(!$btn.clicked && $btn.data("status") == "opened" && $container.hasClass("open")){
                        $me.trigger("multiselect.close");
                        $btn.data("status","closed");
                    }
                    $btn.clicked = false;

                   if($(document).find($btn).size() == 0){
                       return false;
                   }else{
                       return true;
                   }
                }
            );

            var multiselectCloser = function(){
                for(var i=0; i<$.fn.multiselect._closers.length; i++){
                    try {
                        if (!$.fn.multiselect._closers[i].call()) {
                            //Automatic Clean-Up :)
                            delete $.fn.multiselect._closers[i];
                            --i;
                        }
                        ;
                    }catch(ex){
                        //Do Nothing
                    }
                }
            };

            //Make Sure HTML event is only applied once
            $("html").off("click",multiselectCloser).on("click",multiselectCloser);

            //Action Buttons (Select All \ UnSelect All
            if (options.actionsBox) {
                //Select All Button
                $('.bms-select-all', $me).on('click', function () {
                    totalSelectedItemCount = $me.data("multiselect-data").selected;
                    totalItemCount = $me.data("multiselect-data").total;
                    var newunselected;
                    if(totalItemCount == totalSelectedItemCount){
                        if (options.liveSearch && options.keepSearchFocus){
                            $('input[type="text"]', $me).focus();
                        }
                        return;
                    }
                    newunselected = $me.children('li:not(.ms-hide)').filter(function(){ return $('input[type="checkbox"]:checked',this).size() == 0}).each(function(index) {
                        var $t = $(this);
                        var $chk = $('input[type="checkbox"]',$t);
                        var dropID = parseInt($me.data("multiselect-id"));
                        var itemIndex = parseInt($t.data("ms-index"));
                        $.fn.multiselect.items[dropID][itemIndex].checked = true;
                        $chk.trigger('click');
                        totalSelectedItemCount ++;
                    });

                    if (newunselected.length > 0) {
                        $me.trigger("multiselect.itemclicked", {items: newunselected});
                    }

                    if (options.liveSearch && options.keepSearchFocus){
                        $('input[type="text"]', $me).focus();
                    }
                    //Update Title
                    if (totalSelectedItemCount > 0) {
                        var tr8nText = (typeof options.countSelectedText === 'function') ? options.countSelectedText(totalSelectedItemCount, totalItemCount) : options.countSelectedText;
                        title = tr8nText.replace('{0}', totalSelectedItemCount.toString()).replace('{1}', totalItemCount.toString());
                    } else {
                        title = options.noneSelectedText;
                    }
                    //title = htmlEscape(title);
                    if (options.showCaret) {
                        title += '<span class="caret"></span>';
                    }
                    $btn.html(title);

                    $me.data("multiselect-data",{selected:totalSelectedItemCount,total:totalItemCount});
                });
                //Unselect All Button
                $('.bms-deselect-all', $me).on('click', function () {
                    totalSelectedItemCount = $me.data("multiselect-data").selected;
                    totalItemCount = $me.data("multiselect-data").total;
                    var newunselected;
                    if(0 == totalSelectedItemCount){
                        if (options.liveSearch && options.keepSearchFocus){
                            $('input[type="text"]', $me).focus();
                        }
                        return;
                    }
                    newunselected = $me.children('li:not(.ms-hide)').filter(function(){ return $('input[type="checkbox"]:checked',this).size() == 1}).each(function(index) {
                        var $t = $(this);
                        var $chk = $('input[type="checkbox"]',$t);
                        var dropID = parseInt($me.data("multiselect-id"));
                        var itemIndex = parseInt($t.data("ms-index"));
                        $.fn.multiselect.items[dropID][itemIndex].checked = false;
                        $chk.trigger('click');
                        totalSelectedItemCount --;
                    });

                    if (newunselected.length > 0) {
                        $me.trigger("multiselect.itemclicked", {items: newunselected});
                    }

                    if (options.liveSearch && options.keepSearchFocus){
                            $('input[type="text"]', $me).focus();
                    }
                    //Update Title
                    if (totalSelectedItemCount > 0) {
                        var tr8nText = (typeof options.countSelectedText === 'function') ? options.countSelectedText(totalSelectedItemCount, totalItemCount) : options.countSelectedText;
                        title = tr8nText.replace('{0}', totalSelectedItemCount.toString()).replace('{1}', totalItemCount.toString());
                    } else {
                        title = options.noneSelectedText;
                    }
                    //title = htmlEscape(title);
                    if (options.showCaret) {
                        title += '<span class="caret"></span>';
                    }
                    $btn.html(title);

                    $me.data("multiselect-data",{selected:totalSelectedItemCount,total:totalItemCount});
                });

            }

            //Live Search
            if (options.liveSearch) {
                $me.searchtimer = null;
                $('input[type="text"]',$me).on('input propertychange', function (item) {
                    clearTimeout($me.searchtimer);
                    var ms = 500; // milliseconds
                    var $this = $(this);
                    $me.searchtimer = setTimeout(function () {
                        $me.children().filter(".no-results").remove();
                        var no_results = $('<li class="no-results"></li>');
                        if ($this.val()) {
                            if (options.searchInsensitive) {
                                $me.children('li').removeClass('ms-hide').not(':icontains(' + $this.val() + ')').addClass('ms-hide');
                            } else {
                                $me.children('li').removeClass('ms-hide').not(':contains(' + $this.val() + ')').addClass('ms-hide');
                            }

                            if (!$me.find('li').filter(':visible:not(.no-results)').length) {
                                if (!!no_results.parent().length) no_results.remove();
                                no_results.html(options.noneResultsText + ' "' + $this.val() + '"').show();
                                $me.find('li').last().after(no_results);
                            } else if (!!no_results.parent().length) {
                                no_results.remove();
                            }

                        } else {
                            $me.children('li').not('.is-hidden').removeClass('ms-hide');
                            if (no_results.parent().length) no_results.remove();
                        }

                        $me.children('li.active').removeClass('active');
                        $me.children('li').filter(':visible:not(.divider)').eq(0).addClass('active').focus();
                        $this.focus();
                    }, ms);

                });
                $me.on("multiselect.close",function(){
                    if(options.liveSearch){
                        $me.children('li.ms-hide').removeClass("ms-hide");
                        $me.children('li.no-results').remove();
                        $('input[type="text"]',$me).val("");
                    }
                });

            }



        });
    }

    methods.destroy = function(){
        var $me = $(this);
        delete $.fn.multiselect._closers[parseInt($me.data("multiselectid"))];
    }

    methods.updateItems = function(json){
        var $me = $(this);
        var options = $me.data("multiselect-options");
        var dropID = parseInt($me.data("multiselect-id"));
        var title = "";
        var $btn = $('.btn-multiselect[data-multiselect="'+ $me.attr('id') + '"]');
        var totalSelectedItemCount = 0;
        var totalItemCount = 0;
        $.fn.multiselect.items[dropID] = [];
        var html = "";
        for (var key in json){

            html +="<li data-ms-index=" + totalItemCount +">" + json[key].text + '<input type="checkbox" id="' + json[key].value + '" value="' + json[key].value +'" ' + (json[key].checked ? " checked" : "") + '/><i></i></li>';

            if(json[key].checked){
                totalSelectedItemCount++;
            }
            $.fn.multiselect.items[dropID].push(json[key]);
            totalItemCount++;
        }

        $me.children('li').remove();
        $me.append(html);

        //Update Title
        if (totalSelectedItemCount > 0) {
            var tr8nText = (typeof options.countSelectedText === 'function') ? options.countSelectedText(totalSelectedItemCount, totalItemCount) : options.countSelectedText;
            title = tr8nText.replace('{0}', totalSelectedItemCount.toString()).replace('{1}', totalItemCount.toString());
        } else {
            title = options.noneSelectedText;
        }
        //title = htmlEscape(title);
        if (options.showCaret) {
            title += '<span class="caret"></span>';
        }
        $btn.html(title);

        $me.data("multiselect-data",{selected:totalSelectedItemCount,total:totalItemCount});
    }



}(jQuery));



