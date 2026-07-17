/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Chapter',

        ui: {
            //
            title: '.chapter-title',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
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