/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "app/interactions/interactive_video/videoview",
    "text!templates/interactions/interactive-video/mainview.html"],
    function (Marionette, vent, Popup, Splash, VideoView, maintemplate) {
    return Marionette.ItemView.extend({

        name: 'Interactive Video',

        template : maintemplate,
        hasSplash: false,
        hasConclusion: false,
        currentClip: null,
        currentSegment: null,
        currentChapter: null,
        currentInteraction: null,
        TIME_UPDATE_MARGIN: 1.5,
        TIME_UPDATE_THRESHOLD: 0.75,
        LOG_LEVEL: 0,

        ui: {
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.feedback-container',
            mainContainer: '.main-container',
            videoContainer: '.video-container',
            interactionContainer: '.interaction-container',

            continueButton: '.continue-button',
            button: '.main-button',
            scrim: '.scrim-background'
        },

        events : {
            'mouseover @ui.mainContainer': 'onVidOver',
            'mouseout @ui.mainContainer': 'onVidOut',
            'click @ui.mainContainer': 'onVidClicked',
            'click @ui.button.enabled': 'onButtonClicked',
            'click @ui.popupButton': 'showPopup'
        },


        initialize: function (options) {
            trace('mainview: initialize()');
            this.model = options.model;
            this.interactions = options.interactions;
            this.soundPlayer = options.soundPlayer;
            this.chapter = options.chapter;

            var video_config = this.model.get('videoConfig') || {
                    allowFreeProgress: false,
                    controls: ["ctrl-play", "ctrl-volume", "ctrl-time", "ctrl-fullscreen", "ctrl-progressbar"]
            }
            this.videoView = new VideoView({model: new Backbone.Model(video_config), controller: this, soundPlayer: this.soundPlayer});

            this.listenTo(this.videoView, 'videoview:video-complete', this.onVideoComplete);
            this.listenTo(this.videoView, 'videoview:update-time', this.onUpdateTime);
            this.listenTo(this.videoView, 'videoview:can-play-through', this.onVideoCanPlayThrough);
            this.listenTo(this.videoView, 'videoview:new-chapter', this.goToChapter);

            // flag signals when video has actually been paused so that user can interact with interaction
            // and controls are hidden so vid progress/pause/play are effectively disabled
            this.pausedForInteraction = false;
            this.currentSegment = null;
            this.hasSplash = false;
            this.hasConclusion = false;

            this.TIME_UPDATE_MARGIN = 1.5;
            this.TIME_UPDATE_THRESHOLD = 0.75;
        },

        onRender: function() {
            trace('mainview: onRender()');

            this.ui.videoContainer.append(this.videoView.render().el);

            if (this.model.get('text') != undefined && this.model.get('text').splash != undefined) {
                this.hasSplash = true;
                var splashObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'splashscreens/splash.html',
                    items: this.model.get('text').splash.slice(),
                    buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                }
                this.splash = new Splash({model: new Backbone.Model(splashObj)});
                this.ui.splashContainer.append(this.splash.render().el);
                this.listenTo(this.splash, 'popup:complete', this.splashComplete);
            }

            if (this.model.get('text') != undefined && this.model.get('text').conclusion != undefined) {
                this.hasConclusion = true;
                var conclObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'conclusion',
                    badge: this.model.get('menuModel').get('badge'),
                    items: this.model.get('text').conclusion.slice(),
                    buttons: [{'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                };

                this.conclusion = new Splash({model: new Backbone.Model(conclObj)});
                this.ui.conclusionContainer.append(this.conclusion.render().el);
                this.listenToOnce(this.conclusion, 'popup:complete', this.endInteraction);
            }

            if (this.hasSplash && this.chapter == null) {
                this.splash.show();
            } else {
                TweenMax.set(this.$el, {autoAlpha: 0.0});
                TweenMax.to(this.$el, 0.5, {autoAlpha: 1.0, onCompleteScope: this, onComplete: this.startInteraction});
            }


            this.$win = $(window);
            this.constructInteraction();
            //this.startInteraction();
            this.ui.scrim.hide();
            this.ui.continueButton.removeClass('enabled').addClass('disabled');
        },

        splashComplete: function () {
            this.splash.$el.hide();
            this.startInteraction();
        },

        startInteraction: function () {

            this.gotoClip(0);

            this.trigger('mainview:activity-start');
        },

        gotoClip: function (goto) {
            if (_.isNumber(goto)){
                this.currentClip = this.model.clips.at(goto).attributes;
            } else if (_.isString(goto)) {
                this.currentClip = this.model.clips.get(goto).attributes;
            }

            var segments = this.initSegments(),
                nodes = this.currentClip.nodes != undefined ? this.currentClip.nodes : {"chapterMenu": false, "chapters": false, "interactions": true},
                interactions = this.model.interactions;

            this.hasChapters = nodes.chapters;

            if (this.currentClip.nodes != undefined && this.currentClip.nodes.chapters) {
                _.each(segments, function(segment) {
                    var int = this.model.interactions.get(segment.target).attributes;
                    segment = _.extend(segment, int);
                }.bind(this))
            }


            this.videoView.loadClip(this.currentClip, segments, nodes);
        },

        goToChapter: function (segment) {
            var time = segment.triggerTime  / 1000;
            this.videoView.jumpToChapter(time);
            this.currentChapter = segment;
            this.videoView.updateChapter(segment.id);
        },

        onVideoCanPlayThrough: function () {
            trace('VideoCanPlayThrough::::::::>', 6);
            if (this.chapter != null) {
                var segment = _.find(this.currentClip.segments, function (seg) {return this.chapter === seg.target;}.bind(this)),
                    time = segment.triggerTime  / 1000;
                trace('triggerTime::::::::> ' + time, 6);

                this.videoView.jumpToTime(time - 0.5);
                this.chapter = null;
            }
        },

        initSegments: function () {
            var segments = this.currentClip.segments,
                intObj = null, target = '',
                revisedSegments = [];

            _.each(segments, function (segment) {
                if (segment.endTime == undefined && segment.suppressInProgress == undefined) {
                    revisedSegments.push(segment);
                }
            }.bind(this));

            return revisedSegments;
        },

        updateChapter: function(currentPos) {
            var segment, nextSeg, triggerTime1, triggerTime2,
                segs = this.currentClip.segments,
                curChapter = segs[segs.length - 1], i = 0 ;

            for (; i< segs.length - 1; i++) {
                segment = segs[i];
                nextSeg = segs[i+1];
                triggerTime1 = segment.triggerTime / 1000;
                triggerTime2 = nextSeg.triggerTime / 1000;
                if (currentPos >= triggerTime1 && currentPos < triggerTime2) {
                    curChapter = segment;
                    break;
                }
            }

            if (!curChapter) {
                return;
            }

            if (curChapter != this.currentChapter) {
                this.currentChapter = curChapter;
                this.videoView.updateChapter(this.currentChapter.id);
            }
        },

        onUpdateTime: function (currentPos, timeDrag) {
            var triggerTime, startTime, endTime, finalTime, deltaTime,
                newSegment = null;

            if (timeDrag) {
                // If control bar is clicked on or dragged, do nothing and wait for normal update
                return;
            }

            if (this.hasChapters && currentPos > 0) {
                this.updateChapter(currentPos);
            }

            // Determine whether current position is within strike zone of any defined segment's trigger time or run time
            _.each(this.currentClip.segments, function (segment) {
                triggerTime = segment.triggerTime / 1000;
                deltaTime = Math.abs(currentPos - triggerTime);
                finalTime = segment.startTime != undefined ? segment.startTime / 1000 : segment.endTime != undefined ? segment.endTime / 1000 : 0;
                if (deltaTime > this.TIME_UPDATE_THRESHOLD) {
                    // return;
                }
                if (currentPos >= triggerTime && (deltaTime < this.TIME_UPDATE_MARGIN || currentPos < finalTime)) {
                    newSegment = segment;
                    return;
                }
            }.bind(this));

            // If in strike zone and no current segment or new segment != current segment
            if (newSegment && this.currentSegment) {

                // 1) if new segment and current segment equal => a) check for startTime & b) endTime
                if (newSegment.id === this.currentSegment.id) {

                    // a) check for startTime
                    if (this.currentSegment.startTime != undefined) {
                        startTime = this.currentSegment.startTime / 1000;
                        deltaTime = Math.abs(currentPos - startTime);
                        if (deltaTime > this.TIME_UPDATE_THRESHOLD) {
                            return;
                        }
                        if (currentPos <= startTime && deltaTime < this.TIME_UPDATE_MARGIN) {
                            trace('CASE 1.a: hit startTime', this.LOG_LEVEL + 4);
                            this.pauseVideo();
                            this.startOverlayInteraction();
                        }
                    }
                    // b) check for endTime
                    else if (this.currentSegment.endTime != undefined) {
                        endTime = this.currentSegment.endTime / 1000;
                        deltaTime = Math.abs(currentPos - endTime);
                        if (deltaTime > this.TIME_UPDATE_THRESHOLD) {
                            return;
                        }
                        if (currentPos <= endTime && deltaTime < this.TIME_UPDATE_MARGIN) {
                            trace('CASE 1.b: hit endTime', this.LOG_LEVEL + 4);
                            this.stopOverlayInteraction();
                        }
                    }
                }

                // 2) if new segment and current segment not equal => a) destroy current segment and b) create new interaction
                else {
                    trace('CASE 2: destroy current segment and create new interaction', this.LOG_LEVEL + 4);

                    // a) destroy current segment
                    this.destroyOverlayInteraction();

                    // b) create new interaction
                    this.currentSegment = newSegment;
                    this.createOverlayInteraction();
                }
            }

            // 3) if new segment and no current segment => create new interaction
            else if (newSegment && !this.currentSegment) {
                trace('CASE 3: create new interaction', this.LOG_LEVEL + 4);

                // create new interaction
                this.currentSegment = newSegment;
                this.createOverlayInteraction();
            }

            // 4) if NO new segment and current segment => destroy old interaction
            else if (!newSegment && this.currentSegment) {
                trace('CASE 4: destroy current segment', this.LOG_LEVEL + 4);
                // destroy current segment
                this.destroyOverlayInteraction();
            }

            // 5) if NO new segment and NO current segment => do nothing
            else if (!newSegment && !this.currentSegment) {
                // do nothing
            }

        },

        createOverlayInteraction: function () {

            var segment = this.currentSegment,
                target = segment.target,
                intObj = this.model.interactions.get(target).attributes;

            trace("Create Interaction OVerlay ==>", 6);

            if(target == undefined || !_.isString(target) ||  intObj == undefined) {
                return;
            }

            var type = intObj.type,
                interaction = this.interactions[type],
                model = interaction.model != undefined ? new interaction.model(intObj) : new Backbone.Model(intObj),
                template = interaction.template,
                View = interaction.view;

            model.set('assetManifest', this.model.get('assetManifest'));

            this.interaction = new View({template: template, model:model, interactions: this.interactions, soundPlayer:this.soundPlayer});



            this.ui.interactionContainer.empty();
            this.ui.interactionContainer.append(this.interaction.render().el);
            this.interaction.$el.css('pointerEvents', 'none');

            // TODO: replace this with newer local storage solution from "input" type
            if (type === "display" || type === "multidisplay") {
                if (intObj.target != undefined) {
                    var keys = intObj.target.split('.'),
                        id = keys[0],
                        prop = keys[1],
                        content = this.model.interactions.get(id).attributes[prop],
                        element = intObj.element;
                    this.interaction.injectElement(element, content);
                }
            }

            this.listenTo(this.interaction, 'interaction:complete', this.onInteractionComplete);
            this.listenTo(this.interaction, 'interaction:continue', this.onInteractionContinue);

            if ((segment.startTime == undefined && segment.endTime == undefined && type !== 'chapter') || segment.pauseOnStart) {
                this.pauseVideo();
            } else {
                this.interaction.autoPlay = true;
            }
            if (segment.startTime == undefined) {
                this.startOverlayInteraction();
            }



        },

        startOverlayInteraction: function () {
            this.interaction.$el.css('pointerEvents', 'all');
            this.interaction.startInteraction();
        },

        stopOverlayInteraction: function () {
            this.interaction.stopInteraction();
        },

        pauseVideo: function () {
            this.pausedForInteraction = true;
            this.videoView.executePause();
        },

        onInteractionContinue: function () {
            this.videoView.resume();
        },

        onInteractionComplete: function () {
            if (this.interaction) {
                var id = this.interaction.model.get('id'),
                    interactions = this.model.interactions,
                    interaction = interactions.get(id),
                    input;

                interaction.set('completed', true);
                this.currentSegment.completed = true;
                this.videoView.updateSegment(this.currentSegment.id, true);
                this.stopListening(this.interaction, 'interaction:complete', this.onInteractionComplete);
                this.stopListening(this.interaction, 'interaction:continue', this.onInteractionContinue);
                if (this.interaction.model.get('input') != undefined) {
                    input = this.interaction.model.get('input');
                    interaction.set('input', input);
                }
                this.destroyOverlayInteraction();
                this.videoView.resume();
            }
        },

        destroyOverlayInteraction: function () {
            this.ui.interactionContainer.empty();
            this.interaction = null;
            this.currentSegment = null;
            this.pausedForInteraction = false;
        },

        onVideoComplete: function () {
            this.buttonEnable(this.ui.continueButton, true);
        },

        onVidOver: function (e) {
            if(this.pausedForInteraction) {
                return;
            }
            this.videoView.toggleControls(true);
            trace('onVidHolderOut', this.LOG_LEVEL);
        },

        onVidOut: function (e) {
            if (!this.videoView.volumeDrag && !this.videoView.timeDrag) {
                this.videoView.toggleControls(false);
            }
            trace('onVidHolderOut', this.LOG_LEVEL);
        },

        vidClicked: function (e) {

        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            // if standalone, module will respond to 'mainview:activity-complete'
            this.trigger('mainview:activity-complete');

            // if launched as a submodule within a composite module (interactive module),
            // parent view will respond to 'interaction:complete'
            this.trigger('interaction:complete', this.model);
        },

        buttonEnable: function ($button, enable) {
            if(enable) {
                $button.addClass('enabled button-reveal').removeClass('disabled');
                setTimeout(function () {
                    $button.removeClass('button-reveal');
                }.bind(this), 1600)
            } else {
                $button.removeClass('enabled').addClass('disabled');
            }
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget), id = $button.attr('id'), dataID = $button.attr('data-id');

            switch (dataID) {
                case 'continue':
                    if (this.hasConclusion) {
                        this.showConclusion();
                    } else {
                        this.endInteraction();
                    }
            }

            vent.trigger('play_sfx', 'button_click');
        },

        constructInteraction: function () {

        }

    });

});