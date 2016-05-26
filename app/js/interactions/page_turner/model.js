/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Module Model"
        },

        initialize: function(options){
            trace("page_turner moduleModel: init()", 2);

            this.url = options.url;
            this.menuModel = options.menuModel;

            this.fetch({
                success: function () {
                    trace('page_turner module.model.fetch success');
                    this.onDataReady();
                }.bind(this),
                error: function (m, r, o) {
                    trace('page_turner module.model.fetch error: ', 5);
                    trace(m, 5);
                    trace(r, 5);
                    trace(o, 5);
                }
            });
        },

        onDataReady: function () {
            this.set('modulename', this.menuModel.get('moduleName').toLowerCase());

            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function() {
            // set initial values here
        }


    });

    return Model;

});