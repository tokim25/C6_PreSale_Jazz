/**
 * Created by jhoffsis on 12/18/15.
 */

/**
 * Created by jhoffsis on 10/21/15.
 */


define( ["marionette", "backbone", "text!templates/app/nav/overlays/soundview.html", "../../vent"], function (Marionette, BackBone, text, vent) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            displayText: '.sound-text',
            closeButton: '.close-x-button'
        },

        events : {
            'click @ui.closeButton': 'onCloseClicked'
        },

        initialize: function (options) {
            trace('soundview: initialize()');
            this.app = options.app;

            this.soundOn = true;
        },

        onRender: function() {
            trace('soundview: onRender()');
        },

        toggleSound: function (b) {
            this.soundOn = b;
            this.setDisplayText();
            return this.soundOn;
        },

        setDisplayText:function () {
            var displayText = this.soundOn ? 'Unmuted' : 'Muted';
            this.ui.displayText.html(displayText)
        },

        onCloseClicked: function () {
            this.trigger('close:clicked')
        }
    });

});