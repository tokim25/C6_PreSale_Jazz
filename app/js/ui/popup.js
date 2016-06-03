/**
 * Created by jhoffsis on 8/11/15.
 */


define( ["marionette", "app/vent", "text!templates/ui/popup.html"], function (Marionette, vent, text) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            title: '.popup-title',
            body: '.popup-body',
            container: '.popup-view',
            buttons: '.popup-button',
            closeButton: '.close-x-button'
        },

        events : {
            'click @ui.buttons': 'onButtonClicked',
            'click @ui.closeButton': 'onButtonClicked'
        },

        title: '',
        body: '',
        buttons: [],
        containerClass: 'generic-popup',
        showTitle: true,
        multipleScreens: false,

        initialize: function (options) {
            if (options.template) {
                this.template = options.template;
            }
            if (options.model) {
                this.model = options.model;
            }
            trace('popupview: initialize()');

        },

        onRender: function() {
            trace('popupview: onRender()');
            var $button, id, label,
                key, val;


            _.each(_.pairs(this.options), function (pair, i) {
                key = pair[0];
                val = pair[1];
                this[key] = val;
            }.bind(this));

            if ($.isArray(this.body)) {
                this.body = this.body.slice(0);
                this.multipleScreens = true;
            }

            _.each(this.buttons, function (button, i) {
                id = button.id, label = button.label,
                    bclass = id != 'close' ? 'popup-button' : 'close-x-button';
                if (button.class != undefined) {bclass += (' ' + button.class)}
                $button = $('<div data-id="' + id + '" class="' + bclass + '">' + label + '</div>');
                this.ui.container.append($button);
            }.bind(this));

            if (this.showTitle && this.ui.title != undefined && this.title != '') {
                this.ui.title.html(this.title);
            }

            if (this.ui.body != undefined && this.body != '') {
                if (!this.multipleScreens) {
                    this.ui.body.html(this.body);
                } else {
                    this.ui.body.html(this.body.shift());
                    if (this.body.length < 1) {
                        this.lastScreen();
                    }
                }

            }


            this.ui.container.addClass(this.containerClass);

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
            if (textObj.header) {
                this.ui.title.html(textObj.header);
            }
            if (textObj.body) {
                this.ui.body.html(textObj.body);
            }
        },

        nextScreen: function () {
            if (!this.multipleScreens) {
                this.ui.body.html(this.body);
            } else {
                this.ui.body.fadeOut(function () {
                    this.ui.body.html(this.body.shift());
                    if (this.body.length < 1) {
                        this.lastScreen();
                    }

                    this.ui.body.fadeIn();

                }.bind(this))
            }
        },

        lastScreen: function () {
            this.trigger('popup:last-screen');
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');
            this.trigger(id + ':clicked');

            if(id === 'close') {
                this.$el.hide();
            }

            vent.trigger('play_sfx', 'button_click');

            trace('popupview: onButtonClicked', 4);
        },

        onContinueClicked: function () {
            trace('popup: onContinueClicked()', 4);
        },

        onCloseClicked: function () {
            trace('popup: onCloseClicked()', 4);
        }
    });

});