/**
 * Created by jhoffsis on 7/13/15.
 */

define(['backbone',
        'marionette',
        'app/vent',
        'app/app',
        'interactions/page_turner/model',
        'interactions/page_turner/mainview',
        'interactions/page_turner/clickreveal/cr_mediaplans_s3',
        'interactions/page_turner/clickreveal/cr_mediaplans_s6',
        'interactions/page_turner/clickreveal/cr_mediaplans_s7',
        'text!templates/interactions/page_turner/clickreveal/cr_mediaplans_s3.html',
        'text!templates/interactions/page_turner/clickreveal/cr_mediaplans_s6.html',
        'text!templates/interactions/page_turner/clickreveal/cr_mediaplans_s7.html'
    ],
    function(Backbone, Marionette, vent, app, Model, MainView, CRS3, CRS6, CRS7, templateS3, templateS6, templateS7){

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
                    cr_mediaplans_s3: {
                        module: CRS3,
                        template: templateS3
                    },
                    cr_mediaplans_s6: {
                        module: CRS6,
                        template: templateS6
                    },
                    cr_mediaplans_s7: {
                        module: CRS7,
                        template: templateS7
                    }
                },
                chapter: app.deepLinkChapter,
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