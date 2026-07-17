/**
 * Created by jhoffsis on 2/10/16.
 */


define([
    'marionette',
    'app/vent',
    'text!templates/app/ta/taview.html',
    '../vent',
    'app/utils/behaviors/hotkeys_behavior'],
    function (Marionette, vent, text, vent, Hotkeys) {
    return Marionette.ItemView.extend({
        template: text,

        ui: {
            closeButton: '.close-x-button',
            links: '.ta-link',
            scrim: '#ta-scrim'
        },

        events : {
            'click @ui.links': 'onLinkClicked',
            'click @ui.closeButton': 'onCloseClicked'
        },

        behaviors: {
            Hotkeys: {
                behaviorClass: Hotkeys,
                hotkeys: {
                    'ctrl:shift:h': 'showTAScreen'
                },
                attachToDocument: true
            }
        },

        initialize: function (options) {
            this.app = options.app;
        },

        onRender: function() {
            this.$el.hide();
        },

        showTAScreen: function(e) {
            this.$el.fadeIn();
        },

        onCloseClicked: function (e) {

            vent.trigger('play_sfx', 'button_click');
            this.$el.fadeOut();
        },

        onLinkClicked: function (e) {
            var $link = $(e.currentTarget),
                id = $link.attr('data-id');

            if (id === 'unlock') {
                vent.trigger('unlock:submodules');
            } else {

            }
        }
    });
});