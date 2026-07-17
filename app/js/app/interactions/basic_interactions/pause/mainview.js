/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Pause',

        ui: {
            //
            instrux: '.onscreen-instrux',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
        },

        onRender: function() {

            this.ui.scrim.hide();

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

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
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            switch(dataID) {
                case 'continue':
                    this.endInteraction();
                    break;
            }
        },

        fadeDisplay: function () {
            TweenMax.to(this.ui.displayItem, 0.5, {autoAlpha: 0.0, onCompleteScope: this, onComplete: this.endInteraction});
        },

        stopInteraction: function () {
            this.fadeDisplay();
        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        }


    });

});