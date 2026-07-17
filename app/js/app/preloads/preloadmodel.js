/**
 * Created by jhoffsis on 7/27/15.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var model = Backbone.Model.extend({

        //url: 'data/app/preloads.json',

        initialize: function(options){
            trace('moduleModel: init()');
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('Preload.model.fetch success');
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('Preload.model.fetch fail');
                    trace(e);
                }
            });

        },

        modelReady: function () {
            this.trigger('preloadmodel:ready');
        }


    });

    return model;

});


