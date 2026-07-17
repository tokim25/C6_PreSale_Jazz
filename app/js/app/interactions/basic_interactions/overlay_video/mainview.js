/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "app/interactions/interactive_video/videoview"],
    function (Marionette, vent, Popup, Splash, VideoView) {
    return Marionette.ItemView.extend({

        name: 'Overlay Interactive Video',

        hasSplash: false,
        hasConclusion: false,
        currentClip: null,
        currentSegment: null,
        currentInteraction: null,
        TIME_UPDATE_MARGIN: 1.5,
        TIME_UPDATE_THRESHOLD: 0.75,
        LOG_LEVEL: 5,

        ui: {
            feedbackContainer: '.feedback-container',
            mainContainer: '.main-container',
            videoContainer: '.video-container',
            interactionContainer: '.interaction-container',

            continueButton: '#overlay-video-view > .continue-button',
            button: '.main-button',
            scrim: '.scrim-background'
        },

        events : {
            'mouseover @ui.mainContainer': 'onVidOver',
            'mouseout @ui.mainContainer': 'onVidOut',
            'click @ui.mainContainer': 'onVidClicked',
            'click @ui.continueButton.enabled': 'onButtonClicked',
            'click @ui.popupButton': 'showPopup'
        },


        initialize: function (options) {
            trace('mainview: initialize()');
            this.model = options.model;
            this.interactions = options.interactions;
            this.template = options.template;

            var video_config = this.model.get('videoConfig') || {
                    allowFreeProgress: false,
                    controls: ["ctrl-play", "ctrl-volume", "ctrl-time", "ctrl-fullscreen", "ctrl-progressbar"]
            }
            this.videoView = new VideoView({model: new Backbone.Model(video_config), controller: this, soundPlayer: this.soundPlayer});

            this.listenTo(this.videoView, 'videoview:video-complete', this.onVideoComplete);
            this.listenTo(this.videoView, 'videoview:update-time', this.onUpdateTime);

            // flag signals when video has actually been paused so that user can interact with interaction
            // and controls are hidden so vid progress/pause/play are effectively disabled
            this.pausedForInteraction = false;
            this.currentSegment = null;
            this.hasSplash = false;
            this.hasConclusion = false;

            this.totalItems = this.model.get('interactions').length;
            this.completedItems = [];
            this.completed = false;

            this.TIME_UPDATE_MARGIN = 1.5;
            this.TIME_UPDATE_THRESHOLD = 0.75;
        },

        onRender: function() {
            trace('mainview: onRender()');

            this.ui.videoContainer.append(this.videoView.render().el);

            this.$win = $(window);
            this.constructInteraction();
            //this.startInteraction();
            this.ui.scrim.hide();
            this.ui.continueButton.removeClass('enabled').addClass('disabled');
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

            this.initSegments();

            this.videoView.loadClip(this.currentClip, this.initSegments());
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

        onUpdateTime: function (currentPos, timeDrag) {
            var triggerTime, startTime, endTime, finalTime, deltaTime,
                newSegment = null;

            if (timeDrag) {
                // If control bar is clicked on or dragged, do nothing and wait for normal update
                return;
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

        createOverlayInteraction: function (goto) {

            var segment = this.currentSegment,
                target = goto ? goto : segment.target,
                intObj = this.model.interactions.get(target).attributes;

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

            if (type === "display") {
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

            if (segment) {

                if (segment.startTime == undefined && segment.endTime == undefined) {
                    this.pauseVideo();
                }
                if (segment.startTime == undefined) {
                    this.startOverlayInteraction();
                }
            } else {
                this.pauseVideo();
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
        setCompleted: function (bool) {
            this.completed = bool;
        },
        isComplete: function () {
            return this.completed;
        },
        onInteractionComplete: function () {
            if (this.interaction) {
                var id = this.interaction.model.get('id'),
                    interactions = this.model.interactions,
                    interaction = interactions.get(id),
                    goto = this.interaction.model.get('goto'),
                    input;

                interaction.set('completed', true);
                if (this.completedItems.indexOf(id) <0) {
                    this.completedItems.push(id);
                }

                if(this.completedItems.length == this.totalItems) {
                    this.setCompleted(true);
                }

                if (this.currentSegment) {
                    this.currentSegment.completed = true;
                    this.videoView.updateSegment(this.currentSegment.id, true);
                }

                this.stopListening(this.interaction, 'interaction:complete', this.onInteractionComplete);
                if (this.interaction.model.get('input') != undefined) {
                    input = this.interaction.model.get('input');
                    interaction.set('input', input);
                }
                this.destroyOverlayInteraction();

                if (goto != undefined && goto != null && goto != '') {
                    this.createOverlayInteraction(goto);
                } else {
                    this.videoView.resume();
                }

            }
        },

        destroyOverlayInteraction: function () {
            this.ui.interactionContainer.empty();
            this.interaction = null;
            this.currentSegment = null;
            this.pausedForInteraction = false;
        },

        onVideoComplete: function () {
            if (!this.isComplete()) {
                trace("Alert: The video is over but interactions aren't complete!!!", this.LOG_LEVEL)
                return;
            }
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

        endInteraction: function () {
            //this.trigger('mainview:activity-complete');
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
                    this.endInteraction();
            }

            vent.trigger('play_sfx', 'button_click');
        },

        constructInteraction: function () {

        }

       /* loseFocus: function () {
              if(this.videoPlaying) {
                  this.ui.video[0].pause();
                  this.resumeVideo = true;
              }
        },

        getFocus: function () {
            if(this.resumeVideo) {
                this.ui.video[0].play();
            }
            this.resumeVideo = false;
        }*/
    });

});