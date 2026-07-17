/**
 * Created by jhoffsis on 7/29/15.
 */

define (['backbone', 'marionette', 'app/vent', 'app/tracking/trackingmodel'], function(Backbone, Marionette, vent, TrackingModel) {
    var TrackingModule = Marionette.Object.extend({

        initialize: function (options) {
            this.app = options.app;
        },

        start: function() {
            trace('TrackingModule onStart', 1);
            var inLMS = this.app.model.get('inLMS');
            trace('IN_LMS: ' + inLMS, 1);

            if(inLMS) {

                window.onunload = window.onbeforeunload = function () {
                    this.model.exitCourse();
                    LMSFinishWinClosure();
                }.bind(this);

                // initialize LMS
                var init = LMSInitialize();

                if(init !== 'true') {
                    alert('ERROR: Failed to initialize connection with the LMS. Please close the browser and re-launch the training.')
                }

            }

            this.model = new TrackingModel({inLMS:inLMS, app:this.app});

            vent.trigger('appmodule:ready', this);

        },

        ready: function () {
            //this.model = new TrackingModel({inLMS:inLMS, app:app});
        },

        sendData: function () {
            this.model.save();
        },

        setValue: function (name, value) {
            this.model.setValue(name, value);
        },

        getValue: function (name) {
            return this.model.getValue(name);
        }

    });

    return TrackingModule;
});