/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Link',

        ui: {
            //
            instrux: '.onscreen-instrux',
            links: '.link-item',
            linkContainer: '.link-items-container',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
        },

        currentSlide: null,
        $currentSlide: null,
        index: -1,
        LOG_LEVEL: 5,

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.links': 'onLinkClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;

            this.items = this.model.get('items');
        },

        onRender: function() {

            this.ui.scrim.hide();

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

            if (this.autoPlay) {
                this.ui.continueButton.addClass('disabled').removeClass('enabled');
            } else if (this.linksComplete()) {
                this.ui.continueButton.removeClass('disabled').addClass('enabled');
            }
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

        onLinkClicked: function (e) {
            var $link = $(e.currentTarget),
                index = parseInt($link.attr('data-index')),
                item = this.items[index];

            item.requireClick = false;

            if (this.linksComplete() && this.ui.continueButton.hasClass('disabled')) {
                this.buttonEnable(this.ui.continueButton, true);
            }
        },

        linksComplete: function () {
            var completed = true;
            _.each(this.items, function (item) {
                if(item.requireClick != undefined && item.requireClick) {
                    completed = false;
                }
            });

            return completed;
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
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');
            e.preventDefault();
            e.stopImmediatePropagation();
            if (id == 'continue') {
                this.endInteraction();
            }

            vent.trigger('play_sfx', 'button_click');

            return false;
        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        }


    });

});