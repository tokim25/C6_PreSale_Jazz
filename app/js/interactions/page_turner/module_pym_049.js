/**
 * Created by jhoffsis on 7/13/15.
 */

define(['backbone',
        'marionette',
        'app/vent',
        'app/app',
        'interactions/page_turner/model',
        'interactions/page_turner/mainview',
        'interactions/page_turner/clickreveal/cr_pym_s1',
        'interactions/page_turner/clickreveal/cr_pym_s2',
        'text!templates/interactions/page_turner/clickreveal/cr_pym_s1.html',
        'text!templates/interactions/page_turner/clickreveal/cr_pym_s2.html'
    ],
    function(Backbone, Marionette, vent, app, Model, MainView, CRS1, CRS2, templateS1, templateS2){

    var Module = Marionette.Object.extend({


        initialize: function (options) {
            this.url = options.url;
            this.menuModel = options.menuModel;
        },

        start: function() {
            trace('page_turner onStart', 1);

            // create model, passing in url and menu data
            // model calls fetch(), then fires init-complete when data is loaded
            this.model = new Model({url:this.url, menuModel:this.menuModel});
            this.listenTo(this.model, 'model:init-complete', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('page_turner: onModelLoaded()');
            this.initView();
            vent.trigger('module:ready', this.model.get('assetManifest'));
        },

        initView: function () {
            this.view = new MainView({
                model:this.model,
                interactions: {
                    cr_pym_s1: {
                        module: CRS1,
                        template: templateS1
                    },
                    cr_pym_s2: {
                        module: CRS2,
                        template: templateS2
                    }
                },
                soundPlayer: app.soundPlayer
            });
            this.listenTo(this.view, 'mainview:activity-start', this.onActivityStart);
            this.listenTo(this.view, 'mainview:activity-complete', this.onActivityComplete);
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