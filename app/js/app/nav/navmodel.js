/**
 * Created by jhoffsis on 7/27/15.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var model = Backbone.Model.extend({

        defaults: {
            currentSelection: undefined,
            badgeShowDelay: 1500,
            badgeHideDelay: 6000
        },

        //url: 'data/app/nav__.json',

        initialize: function(options){
            trace('moduleModel: init()');
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('Nav.model.fetch success');
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('Nav.model.fetch fail');
                    trace(e);
                }
            });

        },

        modelReady: function () {
            this.trigger('navmodel:ready');
        }


    });

    return model;

});


