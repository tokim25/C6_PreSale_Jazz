/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Module Model"
        },

        initialize: function(options){
            trace("moduleModel: init()");

            this.url = options.url;
            this.menuModel = options.menuModel;

            this.fetch({
                success: function () {
                    trace('module.model.fetch success');
                    this.onDataReady();
                }.bind(this)
            });
        },

        onDataReady: function () {
            this.set('modulename', this.menuModel.get('moduleName').toLowerCase());
            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function() {
            // set initial values here
            this.products = new Backbone.Collection(this.get('products'));
            this.currentProduct = {};
            this.completed = {};
            this.numCompleted = 0;
            this.numTotal = this.products.length * 2;
        },

        isComplete: function () {
              return this.numCompleted >= this.numTotal;
        },

        setItem: function (id, type) {
            this.currentProduct = this.products.get(id);
            if(this.completed[id + '_' + type] == undefined) {
                this.numCompleted = this.numCompleted + 1;
                this.completed[id + '_' + type] = true;
                vent.trigger('update-jira', {'item':'numCompleted: ' + this.numCompleted});
            }
            this.trigger('model:update')
        }


    });

    return Model;

});