/**
 * Created by jhoffsis on 7/27/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/windowfocus/windowfocusview'], function(Backbone, Marionette, vent, MainView){

    var WinfocusModule = Marionette.Object.extend({

        name: 'Intro',

        initialize: function (options) {
            this.app = options.app;
        },

        start: function() {
            trace('Winfocus module onStart');
            this.onModelLoaded();
        },

        onModelLoaded: function () {
            trace('Intro: onModelLoaded()');
            this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {

        },

        initView: function () {
            this.view = new MainView({app: this.app});
        }

    });

    return WinfocusModule;


});