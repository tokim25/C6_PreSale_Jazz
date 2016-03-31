/**
 * Created by jhoffsis on 7/13/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/app', 'interactions/cassette/model', 'interactions/cassette/mainview'], function(Backbone, Marionette, vent, app, Model, MainView){

    var Module = Marionette.Object.extend({


        initialize: function (options) {
            this.url = options.url;
            this.menuModel = options.menuModel;
        },

        start: function() {

            // create model, passing in url and menu data
            // model calls fetch(), then fires init-complete when data is loaded
            this.model = new Model({url:this.url, menuModel:this.menuModel});
            this.listenTo(this.model, 'model:init-complete', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('module: onModelLoaded()');
            this.initView();
            vent.trigger('module:ready', this.model.get('assetManifest'));
        },

        initView: function () {
            this.view = new MainView({model:this.model, soundPlayer: app.soundPlayer});
            this.listenTo(this.view, 'mainview:activity-complete', this.onActivityComplete);
            this.listenTo(this.view, 'mainview:activity-start', this.onActivityStart);
            this.listenTo(this.view, 'mainview:show-conclusion', this.onShowConclusion);
        },

        onShowConclusion: function () {
            vent.trigger('module:show-conclusion');
        },

        onActivityStart: function () {
            vent.trigger('module:start');
        },

        onActivityComplete: function () {
            vent.trigger('module:complete', this.menuModel);
            vent.trigger('module:done');
        },

        onDestroy: function () {
            this.model.destroy();
            this.view.destroy();
        }

    });

    return Module;


});