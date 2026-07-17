/**
 * Created by jhoffsis on 10/23/15.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var model = Backbone.Model.extend({

        defaults: {

        },

        //url: 'data/app/intro.json',

        initialize: function(options){
            trace('moduleModel: init()');
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('Intro.model.fetch success');
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('Intro.model.fetch fail');
                    trace(e);
                }
            });

        },

        modelReady: function () {
            this.trigger('intromodel:ready');
        }


    });

    return model;

});


