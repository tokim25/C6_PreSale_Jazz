/**
 * Created with JetBrains WebStorm.
 * User: johnhoffsis
 * Date: 2/27/15
 * Time: 9:25 AM
 * To change this template use File | Settings | File Templates.
 */

define(['marionette', 'app/vent', 'text!templates/app/winfocus/winfocus.html', 'jquery.winFocus'], function (Marionette, vent, text) {
    return Marionette.ItemView.extend({
        template: text,

        ui: {
            resumeButton: '#winfocus-resume-button',
            scrim: '#winfocus-scrim'
        },

        events : {
            'click @ui.resumeButton': 'onResumeClicked'
        },

        initialize: function(options) {
            this.soundPlayer = options.app.soundPlayer;

            this.listenTo(vent, 'window:lose-focus', this.loseFocus);
            this.listenTo(vent, 'window:get-focus', this.getFocus);
            this.listenTo(vent, 'window:pause', this.pause);
            this.listenTo(vent, 'window:unpause', this.unpause);
        },

        onRender: function() {

            $.winFocus({
                blur: function(event) {
                    vent.trigger('window:lose-focus');
                },
                focus: function(event) {
                    vent.trigger('window:get-focus');
                }
            });

            this.ui.resumeButton.hide();
            this.ui.scrim.hide();
        },

        loseFocus: function (event) {
            trace("Blur\t\t", event);
            this.showPause();
        },

        pause: function (event) {
            this.showPause();
        },

        unpause: function (event) {
            this.hidePause();

        },

        getFocus: function (event) {
            trace("Focus\t\t", event);
        },

        onResumeClicked: function () {
            vent.trigger('window:resume-clicked');
            this.hidePause();
        },

        showPause: function () {
            this.ui.resumeButton.show();
            this.ui.scrim.show();
            this.soundPlayer.pauseAll();
        },

        hidePause: function () {
            this.soundPlayer.resumeAll();
            this.ui.resumeButton.hide();
            this.ui.scrim.hide();

        }
    });
});