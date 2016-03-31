/**
 * Created by jhoffsis on 8/11/15.
 */


define( ["marionette", "app/vent", "text!templates/splashscreens/splash.html", "text!templates/splashscreens/conclusion.html"], function (Marionette, vent, splashtext, conclusiontext) {
    return Marionette.ItemView.extend({

        ui: {
            //
            title: '.popup-title',
            body: '.popup-body',
            container: '.popup-view',
            content: '.splash-text-container',
            buttons: '.popup-button',
            closeButton: '.close-x-button'
        },

        events : {
            'click @ui.buttons': 'onButtonClicked',
            'continueButton': ''
        },

        title: '',
        screenType: 'splash',
        body: '',
        buttons: [],
        containerClass: 'generic-popup',
        showTitle: true,
        multipleScreens: false,

        initialize: function (options) {
            this.model = options.model;

            var template = this.model.get('template');
            if (template.indexOf('text!') > -1) {
                this.template = template;
            } else {
                if (template === 'splash') {
                    this.screenType = 'splash';
                    this.template = splashtext;
                } else {
                    this.screenType = 'conclusion';
                    this.template = conclusiontext;
                }
            }

        },

        onRender: function() {
            trace('popupview: onRender()');
            var $button, id, label,
                key, val;

            for (key in this.model.attributes) {
                this[key] = this.model.attributes[key];
            }

            _.each(this.buttons, function (button, i) {
                id = button.id, label = button.label,
                    bclass = id != 'close' ? 'popup-button' : 'close-x-button';
                $button = $('<div data-id="' + id + '" class="' + bclass + '">' + label + '</div>');
                this.ui.container.append($button);
            }.bind(this));

            this.ui.continueButton = this.$('[data-id=continue]');
            this.ui.container.addClass(this.containerClass);


            this.ui.continueButton.html('Next')
            this.nextScreen();

            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        fadeIn: function () {
            this.$el.fadeIn();
        },

        hide: function () {
            this.$el.hide();
        },

        fadeOut: function () {
            this.$el.fadeOut();
        },

        setText: function (textObj) {
            this.ui.content.fadeOut(function () {
                if (textObj.header) {
                    this.ui.title.html(textObj.header);
                }
                if (textObj.body) {
                    this.ui.body.html(textObj.body);
                }
                this.ui.content.fadeIn();

            }.bind(this))
        },

        nextScreen: function () {

            var textObj = this.elements.shift();
            this.setText(textObj);
            if (this.elements.length == 0) {
                this.ui.continueButton.html('Continue');
                this.lastScreen();
            }
        },

        lastScreen: function () {
            this.trigger('popup:last-screen');
            if (this.screenType === 'conclusion' && this.model.get('badge') != undefined) {
                this.$('.conclusion-image-container').addClass('show-badge');
            }

        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            if (this.elements.length) {
                this.nextScreen();
            } else {
                this.trigger('splash:complete')
            }

            vent.trigger('play_sfx', 'button_click');

        }
    });

});