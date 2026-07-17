/**
 * Created by jhoffsis on 6/30/16.
 */


define(["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Countdown',

        ui: {
            //
            instrux: '.onscreen-instrux',
            continueButton: '.continue-button',
            scrim: '.scrim-background',
            time: '.time-display'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.timerInterval = null;
        },

        onRender: function () {

            this.ui.scrim.hide();

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');
            var duration = parseInt(this.model.get('duration'));
            this.startTimer(duration, this.ui.time)
        },

        startTimer: function (duration, display) {
            var start = Date.now(),
                diff,
                minutes,
                seconds,
                self = this;

            function timer() {
                // get the number of seconds that have elapsed since
                // startTimer() was called
                diff = duration - (((Date.now() - start) / 1000) | 0);

                // does the same job as parseInt truncates the float
                minutes = (diff / 60) | 0;
                seconds = (diff % 60) | 0;

                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;

                display.html(minutes + ":" + seconds);

                if (diff <= 0) {
                    clearInterval(self.timerInterval);
                    self.timerComplete();
                }
            };
            // we don't want to wait a full second before the timer starts
            timer();
            this.timerInterval = setInterval(timer, 30);
        },

        timerComplete: function () {
            this.endInteraction();
        },

        buttonEnable: function ($button, enable) {
            if (enable) {
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

            switch (dataID) {
                case 'continue':

                    this.endInteraction();
                    break;
            }
        },

        fadeDisplay: function () {
            TweenMax.to(this.ui.displayItem, 0.5, {
                autoAlpha: 0.0,
                onCompleteScope: this,
                onComplete: this.endInteraction
            });
        },

        stopInteraction: function () {
            this.fadeDisplay();
        },

        endInteraction: function () {
            clearInterval(this.timerInterval);
            this.trigger('interaction:complete', this.model);
        }


    });

});