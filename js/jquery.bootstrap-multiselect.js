/**************************************************************
 * jQuery Bootstrap Multi-Select
 * Author: Nathan Fiscus
 * Date: May 6, 2015
 * Version: 2.0
 * ************************************************************/

'use strict';

(function ($) {
    var defaultOptions = {
        width:"auto",
        noneSelectedText: 'Nothing selected',
        noneResultsText: 'No results match',
        actionsBox: true,
        searchInsensitive: true,
        liveSearch: true,
        countSelectedText: function (numSelected, numTotal) {
            return (numSelected == 1) ? "{0} item selected" : "{0} items selected";
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

    $.fn.multiselect.items = [];

    methods.init = function (_options) {
        var options = $.extend({}, defaultOptions, _options);
        return this.each(function () {
            var $me = $(this);
            $me.addClass("dropdown-menu")
                .attr("role","menu")
                .wrap('<div style="width:100%;"></div>').parent()
                .prepend('<button class="compatibilitySelectButton btn-multiselect btn-default dropdown-toggle btn" data-multiselect="'+ $me.attr('id') + '" data-status="closed" data-toggle="dropdown" style="font-size: 11px; width: 100%;">&nbsp;</button>')
                .addClass("btn-group")
                .addClass("multiselect-container");
            //
            var $btn = $('.btn-multiselect[data-multiselect="'+ $me.attr('id') + '"]');
            var $container = $btn.parent();

            $container.data("multiselect",$me.attr('id'));
            $btn.clicked = false;

            //Create Item Array
            var arr = [];
            $me.data("multiselect-id",$.fn.multiselect.items.length);
            $me.children().each(function(){
                arr.push($(this));
            });
            $.fn.multiselect.items.push(arr);

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

            $('li input[type="checkbox"]',$me).on("click",function(e) {
                e.stopPropagation();
            });

            $('li',$me).on("click",function(e){
                e.preventDefault();
                e.stopPropagation();
                $('input[type="checkbox"]',$(this)).trigger("click");
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

        });
    }

    methods.destroy = function(){
        var $me = $(this);
        delete $.fn.multiselect._closers[parseInt($me.data("multiselectid"))];
    }



}(jQuery));



