/**
 * Created by jhoffsis on 7/27/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/nav/navmodel', 'app/nav/navview'], function(Backbone, Marionette, vent, Model, MainView){

    var NavModule = Marionette.Object.extend({

        name: 'Nav',

        initialize: function (options) {
            this.app = options.app;
        },
        start: function() {
            trace('Nav module onStart');
            //this.model = new Model();
            this.model = new Model({url:this.options.appModule.url});
            this.listenTo(this.model, 'navmodel:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('Nav: onModelLoaded()');
            //this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {
            this.initView();
        },

        initView: function () {
            this.view = new MainView({model:this.model, app: this.app, trackingModel:this.app.Tracking.model});
            this.listenTo(this.view, 'navview:item-selected', this.onItemSelected);
        },

        onItemSelected: function (id) {
            vent.trigger('nav:item-selected', id);
        }

    });

    return NavModule;


});