/**
 * Created by jhoffsis on 12/18/15.
 */

/**
 * Created by jhoffsis on 10/21/15.
 */


define( ["marionette", "backbone", "text!templates/app/nav/overlays/progressview.html", "../../vent"], function (Marionette, BackBone, text, vent) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            progress: '.progress-text',
            closeButton: '.close-button'
        },

        events : {
            'click @ui.closeButton': 'onCloseClicked'
        },

        initialize: function (options) {
            trace('badgeview: initialize()');
            this.app = options.app;
            this.listenTo(this.app.model.moduleCollection, 'change', this.updateProgress);
            this.listenTo(vent, 'appModel:role-reset', this.updateProgress);
        },

        onRender: function() {
            trace('badgeview: onRender()');
            this.updateProgress();
        },

        updateProgress: function () {
            var percentComplete = this.app.model.getPercentComplete();
            this.ui.progress.html(percentComplete + '%');
        },

        onCloseClicked: function () {
            this.trigger('close:clicked')
        }
    });

});