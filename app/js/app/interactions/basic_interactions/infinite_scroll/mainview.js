/**
 * Created by jhoffsis on 6/30/16.
 */


define([
        "marionette",
        "app/vent",
        "app/utils/animation"],
    function (Marionette, vent, Animation) {
        return Marionette.ItemView.extend({

            name: 'Infinite Scroll',

            ui: {
                //
                pauseButton: '#btn-pause',
                resumeButton: '#btn-resume',
                scrollContainer: '#scroll-container',
                navButton: '.infinite-scroll-nav-button',
                chevron: '#chevron'
            },

            events: {
                'click @ui.navButton': 'onNavClicked',
                'click @ui.pauseButton': 'onPauseClicked',
                'click @ui.resumeButton': 'onResumeClicked'
            },

            LOG_LEVEL: 6,

            initialize: function (options) {
                this.soundPlayer = options.soundPlayer;
                this.template = options.template;
                this.model = options.model;
                this.extensions = options.extensions;
                this.timeline = null;
                this.tweenList = [];
                this.imgPath = this.model.get('imgPath');

                this.listenTo(vent, 'window:pause', this.pause);
                this.listenTo(vent, 'window:unpause', this.unpause);
                this.listenTo(vent, 'window:lose-focus', this.pause);
                this.listenTo(vent, 'window:resume-clicked', this.unpause);
            },

            onRender: function () {

                this.ui.resumeButton.hide();
                this.ui.pauseButton.show();
            },

            onPauseClicked: function (e) {
                vent.trigger('window:pause');

                trace('pauseClicked', 6);
            },


            onResumeClicked: function (e) {
                vent.trigger('window:unpause');

                trace('resumeClicked', 6);
            },

            pause: function () {
                this.ui.resumeButton.show();
                this.ui.pauseButton.hide();
                this.timeline.pause();
            },

            unpause: function () {
                this.ui.resumeButton.hide();
                this.ui.pauseButton.show();
                this.timeline.resume();
            },

            onNavClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('data-id'),
                    item = _.find(this.model.get('navButtons'), function(obj) {return obj.id == id;}),
                    goto = item.goto;

                trace('goto:' + goto, 6);

                this.ui.navButton.removeClass('active');
                $button.addClass('active');

                this.timeline.pause();
                this.timeline.play(goto);
            },

            startInteraction: function () {
                this.trigger('mainview:activity-start');

            },

            onTimelineComplete: function () {
                this.stopInteraction();
            },

            stopInteraction: function () {
                this.endInteraction();
            },

            endInteraction: function () {
                this.trigger('interaction:complete', this.model);
            },

            onDestroy: function () {
                /*this.tl_enter.kill();
                this.tl_leave.kill();
                for (var i = 0; i<this.tweenList.length; i++) {
                    this.tweenList[i].kill();
                }*/

            },

            createElement: function (element) {
                var $el, htmlStr;
                if (element.el) {
                    $el = $(element.el);
                } else if (element.tag) {
                    htmlStr = '<' + element.tag + '>' + '</' + element.tag + '>'
                    $el = $(htmlStr);
                    if (element.tag === 'img') {
                        $el.attr('src', this.pathForID(element.id));
                    }
                }

                if(element.content) {
                    $el.html(element.content);
                }
                if (element.children && element.children.length) {
                    for (var i = 0; i <element.children.length; i++) {
                        var child = element.children[i], $child;
                        if (child.tag && child.tag === 'svg') {
                            $child = this.createSVGPath(child);
                        } else {
                            $child = this.createElement(child);
                        }
                        $el.append($child);
                    }
                }

                $el.attr('id', element.id);

                $el.attr('class', element.class);

                if (element.props) {
                    TweenMax.set($el, element.props);
                }

                return $el;

            },

            createSVGPath: function (element) {
                var $el, htmlStr, path, pathStr;

                htmlStr = '<svg id="' + element.id + '" class="' + element.class + '" x="0" y="0" viewbox="0 0 ' + element.props.width + ' ' + element.props.height + '" >';

                for (var i = 0; i <element.children.length; i++) {
                    path = element.children[i];
                    pathStr = '<path id="' + path.id + '" class="' + path.class + '" d="' + path.path + '" />'
                    htmlStr += pathStr;
                }

                htmlStr += '</svg>';

                $el = $(htmlStr);

                if (element.props) {
                    TweenMax.set($el, element.props);
                }

                TweenMax.to($el.find('path'), 0.01, {drawSVG: 0});

                return $el;
            },

            pathForID: function (id) {
                var manifest = this.model.get('assetManifest'),
                    asset = _.find(manifest, function (item) {
                        return item.id == id;
                    });

                return asset.src;
            },

            playSound: function (args, onComplete) {
                var id = args[0];

                if (onComplete) {
                    this.soundPlayer.playSound(id, {}, onComplete, this);
                } else {
                    this.soundPlayer.playSound(id);
                }

                trace("playSound", this.LOG_LEVEL);
            },

            playTimeline: function (goto) {
                if(goto == undefined) {
                    this.timeline.resume();
                } else {
                    this.timeline.play(goto);
                }
                trace("playTimeline", this.LOG_LEVEL);
            },

            scrollTo: function (args) {
                var id = args[0],
                    $target = this.$('#' + id),
                    targetTop = $target.offset().top,
                    yPos = targetTop - 75,
                    viewableHeight = $(window).height() + targetTop;

                this.ui.scrollContainer.height(viewableHeight);
                TweenMax.to($(window), 1.5, {scrollTo: yPos})
                trace("scrollTo", this.LOG_LEVEL);
            },

            scrollToContinue: function () {
                this.toggleScrollDetection(true);
            },

            toggleScrollDetection: function (toggle) {
                this.scrollTop = $(window).scrollTop();
                if (toggle) {
                    this.ui.chevron.addClass('active');
                    $(window).on('scroll', $.proxy(this.detectScroll, this));
                } else {
                    this.ui.chevron.removeClass('active');
                    $(window).off('scroll', $.proxy(this.detectScroll, this));
                    this.playTimeline();
                }

            },

            detectScroll: function () {
                var delta = $(window).scrollTop() - this.scrollTop;
                if (delta > 10) {
                    this.toggleScrollDetection(false);
                    trace("delta: " + delta, 6);
                }
            },

            constructInteraction: function () {
                var elements = this.model.get('elements'), $el;

                this.ui.scrollContainer.css('opacity', 0);

                _.each(elements, function (element, i) {
                    if (element.tag && element.tag === 'svg') {
                        $el = this.createSVGPath(element);
                    } else {
                        $el = this.createElement(element);
                    }
                    this.ui.scrollContainer.append($el);

                }.bind(this));
                TweenMax.to(this.ui.scrollContainer, 0.5, {opacity: 1});

                // return;

                var animations = this.model.get('animations')

                this.splits = [];

                setTimeout(function () {
                    if (animations != undefined) {
                        this.timeline = new TimelineMax({
                            //onComplete: this.onTimelineComplete,
                            onCompleteScope: this,
                            paused: true
                        });

                        var animationEffects = {
                            "zoomIn": {
                                "scale": 0.3,
                                "autoAlpha": 0,
                                "ease": "Back.easeOut"
                            },
                            "fadeInFromTop": {
                                "marginTop": "-=30px",
                                "autoAlpha": 0,
                                "ease": "Power3.easeOut"
                            },
                            "fadeInFromRight": {
                                "left": "+=60px",
                                "autoAlpha": 0,
                                "ease": "Power3.easeOut"
                            },
                            "fadeInFromLeft": {
                                "left": "-=60px",
                                "autoAlpha": 0,
                                "ease": "Power3.easeOut"
                            }
                        }

                        var animObj = {
                            scope: this,
                            tl: this.timeline,
                            tweenList: animations,
                            splits: this.splits,
                            animMap: animationEffects
                            //animMap: this.model.get('animationEffects')
                        }

                        Animation.buildTimeline(animObj);

                    }

                    if (this.extensions) {
                        this.extensions.initialize(this);
                    }

                    var startScene = this.model.get('startScene') || 's0'

                    this.timeline.play(startScene);
                    trace('TIMELINE', 6);
                    trace(this.timeline, 6);

                    window.timeline = this.timeline;
                    window.scrollview = this;

                }.bind(this), 1000);





            }


        });

    });