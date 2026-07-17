/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "../../vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/video_embedded/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
        var VideoView = Marionette.ItemView.extend({

        template : text,
            hasSplash: false,
            hasConclusion: false,

        ui: {
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.feedback-container',
            youtubeAPI: '#youtubeAPI',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
        },

        events : {
            'click @ui.continueButton.enabled': 'onButtonClicked',
            'click @ui.popupButton': 'showPopup'
        },


        initialize: function (options) {
            trace('mainview: initialize()');
            this.model = options.model;

            this.listenTo(vent, 'window:lose-focus', this.loseFocus);
            this.listenTo(vent, 'window:resume-clicked', this.getFocus);

            this.videoPlaying = false;
            this.isVideoReady = false;
            this.resumeVideo = false;
            this.isIntroComplete = false;
            this.hasSplash = false;
            this.hasConclusion = false;
        },

        onRender: function() {
            trace('mainview: onRender()');

            var feedbackObj = {
                'template': popuptext,
                'showTitle': true,
                'title': 'The new and IMPROVED title!',
                'body': '<p>The new and improved popup title, fo sho! O, wait, this is complete crap!</p>',
                'buttons': [{'id': 'ok', 'label': 'OK'}],
                'containerClass': 'tamborine-popup'
            }

            //TODO: undo this feedback popup
            this.feedback = new Popup(feedbackObj);
            this.listenTo(this.feedback, 'ok:clicked', this.onFeedbackDismissed);
            this.ui.feedbackContainer.append(this.feedback.render().el);

            this.$feedback = this.feedback.$el.find('.tamborine-popup');

            if (this.model.get('text').splash != undefined) {
                this.hasSplash = true;
                var splashObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'splashscreens/splash.html',
                    items: this.model.get('text').splash.slice(),
                    buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Next'}],
                    //buttons: [{'id': 'continue', 'label': 'Next'}],
                    containerClass: 'splash-popup'
                }
                this.splash = new Splash({model: new Backbone.Model(splashObj)});
                this.ui.splashContainer.append(this.splash.render().el);
                this.listenTo(this.splash, 'popup:complete', this.splashComplete);
            }

            if (this.model.get('text').conclusion != undefined) {
                this.hasConclusion = true;
                var conclObj = {
                    colors: this.model.get('colors'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'conclusion',
                    badge: this.model.get('menuModel').get('badge'),
                    elements: this.model.get('text').conclusion.slice(),
                    buttons: [{'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                };

                this.conclusion = new Splash({model: new Backbone.Model(conclObj)});
                this.ui.conclusionContainer.append(this.conclusion.render().el);
                this.listenToOnce(this.conclusion, 'splash:complete', this.endInteraction);
            }


            this.$win = $(window);
            //this.startInteraction();
            this.ui.scrim.hide();
            this.ui.continueButton.removeClass('enabled').addClass('disabled');

            var self = this;

            setTimeout(function () {
                this.constructInteraction();
                if (this.hasSplash) {
                    this.splash.show();
                } else {
                    TweenMax.set(this.$el, {autoAlpha: 0.0});
                    TweenMax.to(this.$el, 0.5, {autoAlpha: 1.0, onCompleteScope: this, onComplete: this.startInteraction});
                }
            }.bind(this), 500);





        },

        splashComplete: function () {
            this.splash.$el.hide();
            this.startInteraction();
        },

        startInteraction: function () {
            this.isIntroComplete = true;

            // check to make sure video is ready
            if(this.isVideoReady) {
                this.youtube_player.playVideo();
                this.videoPlaying = true;
            }
            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        showFeedback: function () {
            this.feedback.$el.fadeIn();
            this.ui.scrim.fadeIn();
        },

        hideFeedback: function () {
            this.feedback.$el.fadeOut();
            this.ui.scrim.fadeOut();
        },

        onVideoComplete: function () {
            this.ui.continueButton.addClass('enabled').removeClass('disabled');
            this.videoPlaying = false;
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget), id = $button.attr('id'), dataID = $button.attr('data-id');

            switch (dataID) {
                case 'submit':
                    break;
                case 'continue':
                    if(this.hasConclusion) {

                        this.showConclusion();
                    } else {
                        this.endInteraction();
                    }
            }

            vent.trigger('play_sfx', 'button_click');
        },

        constructInteraction: function () {
            var self = this,
                videoData = this.model.get('videoData');

            if(YT != undefined) {
                //creates the player object
                this.youtube_player;

                this.youtube_player = new YT.Player('youtube_player', {
                    height: videoData.height,
                    width: videoData.width,
                    videoId: videoData.videoID,
                    events: {
                        'onReady': $.proxy(self.onYouTubePlayerReady, this),
                        'onStateChange': $.proxy(self.onYouTubePlayerStateChange, this)
                    }
                });

            }

        },

        onYouTubePlayerReady: function (e) {
            this.isVideoReady = true;
            if(this.isIntroComplete) {
                this.videoPlaying = true;
                e.target.playVideo();
            }
        },

        onYouTubePlayerStateChange: function (e) {
            /*
             YT.PlayerState.ENDED
             YT.PlayerState.PLAYING
             YT.PlayerState.PAUSED
             YT.PlayerState.BUFFERING
             YT.PlayerState.CUED
             */
            trace('onYouTubePlayerStateChange: ' + e.data, 5);

            if (e.data === YT.PlayerState.ENDED) {
                this.onVideoComplete();
            }
        },

        loseFocus: function () {
              if(this.videoPlaying) {
                  this.youtube_player.pauseVideo();
                  this.resumeVideo = true;
              }
        },

        getFocus: function () {
            if(this.resumeVideo) {
                this.youtube_player.playVideo();
            }
            this.resumeVideo = false;
        }
    });

        return VideoView;

});