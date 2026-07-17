/**
 * Created by jhoffsis on 2/10/16.
 */


define(['backbone',
    'marionette',
    'app/vent',
    'app/debug/debugview'],
    function(Backbone, Marionette, vent, MainView){

    var DebugModule = Marionette.Object.extend({

        name: 'Debug',


        initialize: function (options) {
            this.app = options.app;
            this.appModel = options.app.model;
        },

        start: function() {
            trace('DebugModule onStart');
            this.onModelLoaded();
        },

        onModelLoaded: function () {
            trace('DebugModule: onModelLoaded()');
            //this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {
            this.initView();
        },

        initView: function () {
            this.view = new MainView({app: this.app});
        }

    });

    return DebugModule;


});