/**
 * Created by jhoffsis on 10/23/15.
 */


define(['backbone', 'marionette', 'app/vent', 'app/intro/intromodel', 'app/intro/introview'], function(Backbone, Marionette, vent, Model, MainView){

    var IntroModule = Marionette.Object.extend({

        name: 'Intro',

        initialize: function (options) {
            this.app = options.app;
        },

        start: function() {
            trace('Intro module onStart');
            this.model = new Model({url:this.options.appModule.url});
            this.model.set('roleChooser', this.app.model.get('roleChooser'));
            this.listenTo(this.model, 'intromodel:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('Intro: onModelLoaded()');
            this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {

        },

        initView: function () {
            this.view = new MainView({model:this.model, app: this.app, trackingModel:this.app.Tracking.model});
            this.listenTo(this.view, 'introview:item-selected', this.onItemSelected);
        },

        onRoleSelected: function (id) {
            vent.trigger('intro:role-selected', id);
        }

    });

    return IntroModule;


});