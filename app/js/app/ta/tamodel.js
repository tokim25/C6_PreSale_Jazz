/**
 * Created by jhoffsis on 2/10/16.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var model = Backbone.Model.extend({

        //url: 'data/app/preloads.json',

        initialize: function(options){
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('TA.model.fetch success', 5);
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('TA.model.fetch fail', 5);
                    trace(e);
                }
            });

        },

        modelReady: function () {
            this.trigger('model:ready');
        }


    });

    return model;

});