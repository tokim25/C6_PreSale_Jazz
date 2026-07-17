/**
 * Created by jhoffsis on 7/10/15.
 */

define(['marionette', '../vent'], function (Marionette, vent) {


    var Utilities = Marionette.Object.extend({

        LOG_LEVEL: 0,

        initialize: function(options){
            /*
             Sets up global logging functionality
             */
            this.model = options.model;


            if (!this.model.loggingEnabled) {
                this.LOG_LEVEL = 100;
            }

            this.enableLogging();

            /*
             Provides requestAnimationFrame in a cross browser way.
             http://paulirish.com/2011/requestanimationframe-for-smart-animating/
             */
            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = (function() {
                    return window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                        window.oRequestAnimationFrame ||
                        window.msRequestAnimationFrame ||
                        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                            window.setTimeout(callback, 1000 / 60);
                        };
                })();
            }

            _.mixin({
                pluckDeepReplace: function(options) {
                    var obj = options.obj,
                        key = options.key,
                        replaceWhat = options.replaceWhat,
                        replaceWith = options.replaceWith;
                    for (var p in obj) {
                        if(p === key) {
                            obj[p] = obj[p].replace(replaceWhat, replaceWith)
                        }else {
                            if(_.isObject(obj[p])) {
                                this.pluckDeepReplace({
                                    obj: obj[p],
                                    key: key,
                                    replaceWhat: replaceWhat,
                                    replaceWith: replaceWith
                                })
                            }
                        }
                    }

                }
            });



        },

        configure: function (config) {
            if (!config.loggingEnabled) {
                this.LOG_LEVEL = 100;
            }

            if (_.isNumber(config.logLevel)){
                this.LOG_LEVEL = config.logLevel;
            }

            if (config.youtubeEnabled){
                this.enableYoutube();
            }
        },

        enableLogging: function () {
            window.trace = function (msg, level) {
                level = level || 0;

                if(level < this.LOG_LEVEL) {
                    return;
                }

                try {
                    console.log(msg);
                } catch(e) {
                    // suppressed error
                }
            }.bind(this);
        },

        enableYoutube: function () {
            /*
             Loads API for YouTube Embedded Video
             */
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


            window.onYouTubeIframeAPIReady = function() {
                trace('onYouTubeIframeAPIReady', 5)
            }
        }
    });
    return Utilities;
})















