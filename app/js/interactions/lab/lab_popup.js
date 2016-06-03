/**
 * Created by jhoffsis on 8/11/15.
 */


define( ["marionette", "app/vent", "text!templates/ui/popup.html"], function (Marionette, vent, text) {
    return Marionette.ItemView.extend({
        template: text,
        ui: {
            //
            title: '.popup-title',
            body: '.popup-body',
            container: '.popup-view',
            content: '.content',
            buttons: '.popup-button',
            closeButton: '.close-x-button',
            downloadButton: '.lab-download'

        },

        events : {
            'click @ui.buttons': 'onButtonClicked',
            'click @ui.downloadButton': 'onDownloadClicked',
            'continueButton': ''
        },

        title: '',
        screenType: 'splash',
        body: '',
        buttons: [],
        containerClass: 'generic-popup',
        showTitle: true,
        stopOnLastElement: false,
        labCompleted: false,

        initialize: function (options) {
            this.items = options.items;
            if(options.template != undefined) {
                this.template = options.template;
            }

            this.stopOnLastElement = options.stopOnLastElement || false;

            this.index = -1;

        },

        onRender: function() {
            trace('popupview: onRender()');
            var $button, id, label,
                key, val;

            /*for (key in this.model.attributes) {
                this[key] = this.model.attributes[key];
            }*/

            _.each(_.pairs(this.options), function (pair, i) {
                key = pair[0];
                val = pair[1];
                this[key] = val;
            }.bind(this));

            _.each(this.buttons, function (button, i) {
                id = button.id, label = button.label,
                    bclass = id != 'close' ? 'popup-button' : 'close-x-button';
                $button = $('<div data-id="' + id + '" class="' + bclass + '">' + label + '</div>');
                this.ui.container.append($button);

            }.bind(this));

            this.ui.continueButton = this.$('[data-id=continue]');
            this.ui.backButton = this.$('[data-id=back]');
            this.ui.container.addClass(this.containerClass);

            this.ui.backButton.addClass('disabled');

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
            this.index ++;

            if (this.index <= this.items.length - 1) {
                var textObj = this.items[this.index];
                this.setText(textObj);
            }

            if (this.index == this.items.length - 1) {
                if (!this.labCompleted) {
                    this.ui.continueButton.addClass('disabled');
                }
                this.trigger('popup:last-screen');
            } else if (this.index == this.items.length) {
                this.index --;
                this.trigger('popup:complete')
            }

            if(this.index > 0) {

                this.ui.backButton.removeClass('disabled');
            }
        },

        prevScreen: function () {
            this.index --;

            if (this.index < 0) {
                this.index = 0;
            }
            if (this.index == 0) {
                this.ui.backButton.addClass('disabled');
            }

            this.ui.continueButton.removeClass('disabled');

            var textObj = this.items[this.index];
            this.setText(textObj);
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            if (id == 'continue') {
                this.nextScreen();
            } else if (id == 'back') {
                this.prevScreen();
            }

            vent.trigger('play_sfx', 'button_click');

        },

        onDownloadClicked: function (e) {
            this.labCompleted = true;

            this.ui.continueButton.removeClass('disabled');

            vent.trigger('play_sfx', 'button_click');

        }
    });

});