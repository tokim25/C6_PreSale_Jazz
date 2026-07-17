/**
 * Created by jhoffsis on 7/27/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/preloads/preloadmodel'], function(Backbone, Marionette, vent, Model){

    var NavModule = Marionette.Object.extend({

        name: 'Preload',

        initialize: function (options) {
            this.app = options.app;
        },
        start: function() {
            trace('Preload module onStart');
            this.model = new Model({url:this.options.appModule.url});

            this.listenTo(this.model, 'preloadmodel:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('Preload: onModelLoaded()');
            //this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {
            //this.initView();
        },

    });

    return NavModule;


});