/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/audio_clickreveal/mainview.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            feedbackContainer: '.feedback-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            scrim: '.scrim-background',
            continueButton: '.continue-button',
            submitButton: '.creative-submit-button',
            ctaButton: '.creative-cta-button',
            stationLabel: '.creative-radio-station-label'
        },

        events : {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.ctaButton': 'onCTAButtonClicked',
            'click @ui.submitButton': 'onSubmitButtonClicked'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            this.soundPlayer = options.soundPlayer;

        },

        onRender: function() {
            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'continue', 'label': 'OK!'}],
                'containerClass': 'blob1-popup'
            }
            this.feedback = new Popup(textObj);
            this.listenTo(this.feedback, 'continue:clicked', this.checkAnswer);

            this.ui.feedbackContainer.append(this.feedback.render().el);

            var splashObj = {
                colors: this.model.get('colors'),
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

            this.ui.scrim.hide();

            this.constructInteraction();

            this.$win = $(document);

            this.buttonEnable(this.ui.continueButton, false);

            TweenMax.set(this.feedback.$el.find('.popup-view'), {autoAlpha: 0.0});

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.fadeOut();

            this.feedback.$el.show();

            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onButtonClicked: function () {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            vent.trigger('play_sfx', 'button_click');

            this.showConclusion();
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

        onCTAButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                dataID = $button.attr('data-id'),
                cta = this.model.ctas.get(dataID),
                audioID = cta.get('audioID');

            this.ui.ctaButton.removeClass('selected');
            $button.addClass('selected');

            this.ui.stationLabel.html(cta.get('title'));

            this.$selectedButton = $button;

            vent.trigger('play_sfx', 'radio_click');
            setTimeout(function () {
                this.soundPlayer.playSound(audioID);
            }.bind(this), 200)


        },

        onSubmitButtonClicked: function () {
            var dataID = this.$selectedButton.attr('data-id'),
                cta = this.model.ctas.get(dataID),
                feedbackObj = cta.get('feedback');

            feedbackObj.body = '<p>' + feedbackObj.body + '</p>';

            this.model.updateChoice(dataID);

            vent.trigger('play_sfx', 'radio_click');

            this.showFeedback(feedbackObj, 0.2);


        },

        showFeedback: function (content, delay) {
            delay = delay || 0;

            this.feedback.setText(content);

            var correct = this.model.isCorrect(),
                $popup = this.feedback.$el.find('.popup-view');

            if(correct) {
                $popup.addClass('correct');
            }

            TweenMax.set($popup, {scale: 0.7})
            TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 1.0, scale: 1.0, ease: Back.easeOut});

            setTimeout(function () {
                vent.trigger('play_sfx', 'popup');
            }.bind(this), delay*1000);

            //TODO: size the scrim to $win dimensions, or include onresize method
            this.ui.scrim.fadeIn(300);
        },

        hideFeedback: function (delay) {

            delay = delay || 0;

            var $popup = this.feedback.$el.find('.popup-view');

            $popup.removeClass('correct');
            TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 0.0, ease: Power3.easeOut})

            this.ui.scrim.fadeOut(300);
        },

        checkAnswer: function () {

            this.hideFeedback(0);

            if(this.model.isCorrect()) {
                this.showConclusion();
            } else {
                this.ui.submitButton.removeClass('selected');
                this.ui.ctaButton.removeClass('selected');
            }
        },

        constructInteraction: function () {
            var $ctaButton,
                $buttonContainer = this.$('.creative-buttons');

            this.model.ctas.each(function (cta, index) {
                $ctaButton = $('<div class="creative-cta-button" data-id="' + cta.get('id') + '"></div>');
                $ctaButton.html('<p>CTA ' + (index + 1) + '</p>');
                $buttonContainer.append($ctaButton);
            }.bind(this));

            this.ui.ctaButton = this.$('.creative-cta-button');


        },



        onDestroy: function () {
        }
    });

});