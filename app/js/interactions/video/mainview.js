/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/video/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.feedback-container',
            video: 'video',
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
            this.resumeVideo = false;
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
            this.feedback = new Popup(feedbackObj);
            this.listenTo(this.feedback, 'ok:clicked', this.onFeedbackDismissed);
            this.ui.feedbackContainer.append(this.feedback.render().el);

            this.$feedback = this.feedback.$el.find('.tamborine-popup');

            var splashObj = {
                bg_info: this.model.get('bg_info'),
                name: this.model.get('name'),
                modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                template: 'splash',
                elements: this.model.get('text').splash.slice(),
                buttons: [{'id': 'continue', 'label': 'Next'}],
                containerClass: 'splash-popup'
            }
            this.splash = new Splash({model: new Backbone.Model(splashObj)});
            this.ui.splashContainer.append(this.splash.render().el);
            this.listenTo(this.splash, 'splash:complete', this.startInteraction);

            if (this.model.get('text').conclusion != undefined) {
                this.hasConclusion = true;
                var conclObj = {
                    bg_info: this.model.get('bg_info'),
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

            this.splash.show();

            this.$win = $(window);
            this.constructInteraction();
            //this.startInteraction();
            this.ui.scrim.hide();
            this.ui.continueButton.removeClass('enabled').addClass('disabled');
        },

        startInteraction: function () {
            this.splash.$el.hide();
            this.ui.video.show();
            this.ui.video[0].play();
            this.videoPlaying = true;
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
                    if (this.hasConclusion) {
                        this.showConclusion();
                    } else {
                        this.endInteraction();
                    }
                    break;
            }

            vent.trigger('play_sfx', 'button_click');
        },

        constructInteraction: function () {
            this.ui.video.bind("ended", function() {
                this.onVideoComplete();
            }.bind(this));

            this.ui.video.bind("pause", function() {
                this.videoPlaying = false;
                trace("video PAUSE", 4);
            }.bind(this));

            this.ui.video.bind("play", function() {
                this.videoPlaying = true;
                trace("video PLAY", 4);
            }.bind(this));

            this.ui.video.hide();
            var videoFile = this.model.get('videoPath'),
                //markup = "<source src='"+videoFile+".mp4' type='video/mp4'><source src='"+videoFile+".webm' type='video/webm'>";
                markup = "<source src='"+videoFile+".mp4' type='video/mp4'>";
            this.ui.video.html(markup);
            this.ui.video[0].load();
        },

        loseFocus: function () {
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
        }
    });

});