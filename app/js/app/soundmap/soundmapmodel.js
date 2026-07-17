/**
 * Created by jhoffsis on 7/27/15.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var model = Backbone.Model.extend({

        //url: 'data/app/soundmap.json',

        initialize: function(options){
            trace('moduleModel: init()');
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('Soundmap.model.fetch success');
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('Soundmap.model.fetch fail');
                    trace(e);
                }
            });

        },

        modelReady: function () {
            this.trigger('soundmapmodel:ready');
        }


    });

    return model;

});


