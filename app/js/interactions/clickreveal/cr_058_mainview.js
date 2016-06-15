/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/click_reveal/cr-058-mainview.html",
    "text!templates/ui/popup_feedback.html"],
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
            items: '.cr-item'
        },

        events : {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.items': 'onItemClicked'
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
                'buttons': [{'id': 'continue', 'label': 'Close', 'class': 'dark-button'}],
                'containerClass': 'main-popup'
            }
            this.textbox = new Popup(textObj);
            this.listenTo(this.textbox, 'continue:clicked', this.onDetailComplete);

            this.ui.feedbackContainer.append(this.textbox.render().el);
            this.$popupView = this.textbox.$el.find('.popup-view');

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

            this.ui.scrim.hide();

            this.constructInteraction();

            this.$win = $(document);

            this.buttonEnable(this.ui.continueButton, false);

            TweenMax.set(this.$popupView, {autoAlpha: 0.0});

            this.splash.show();
            this.$el.hide();
            this.$el.fadeIn();
        },

        startInteraction: function () {
            this.splash.fadeOut();

            this.textbox.$el.show();

            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onButtonClicked: function (e) {
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

        onItemClicked: function (e) {
            var $button = $(e.currentTarget),
                dataID = $button.attr('data-id'),
                item = this.model.items.get(dataID),
                audioID = item.get('audioID'),
                textObj = {
                    header: item.get('header'),
                    body: item.get('body')
                };

            this.model.updateChoice(dataID);

            this.ui.items.removeClass('selected');
            $button.addClass('selected');


            this.$selectedButton = $button;

            vent.trigger('play_sfx', 'answer_click');


            this.showText(textObj, 0.5);
            this.startAnimation();


        },

        onDetailComplete: function () {
            this.$selectedButton.removeClass('selected').addClass('completed');
            this.stopAnimation();
            this.hideText();
            if (this.model.allComplete()) {
                this.buttonEnable(this.ui.continueButton, true);
            }
        },

        showText: function (content, delay) {
            delay = delay || 0;

            this.textbox.setText(content);

            TweenMax.set(this.$popupView, {autoAlpha: 0.0});
            TweenMax.to(this.$popupView, 0.5, {delay: delay, autoAlpha: 1.0});
           // setTimeout(function () {
                vent.trigger('play_sfx', 'dial_turn');
            //}, delay*1000);
            //}, delay*1000);

            this.ui.scrim.fadeIn(300);
        },

        hideText: function (delay) {

            delay = delay || 0;

            TweenMax.to(this.$popupView, 0.5, {delay: delay, autoAlpha: 0.0});

            this.ui.scrim.fadeOut(300);
        },

        startAnimation: function () {
            if(this.tl_anim) {
                this.tl_anim.play(0);
            }
        },

        stopAnimation: function () {
            if(this.tl_anim) {
                this.tl_anim.stop(0);
            }
        },

        onAnimComplete: function () {

        },

        constructInteraction: function () {
            /*this.tl_anim = new TimelineMax({
                paused: true,
                onComplete: this.onAnimComplete,
                onCompleteScope: this
            });*/

        },

        onDestroy: function () {

        }
    });

});