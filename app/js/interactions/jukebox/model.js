/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Module Model"
        },

        dict: {},
        numTotal: 0,

        initialize: function(options){
            trace("creativepoliciesModel: init()");

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
            var items = this.get('items');
            this.items = new Backbone.Collection(items);

            this.dict = {};
            this.numTotal = this.items.length;
        },

        updateChoice: function (dataID) {
            this.curChoice = this.items.get(dataID);
            vent.trigger('update-jira', {'item':'item: ' + dataID});
            this.dict[dataID] = true;
        },

        allComplete: function () {
            return _.size(this.dict) >= this.numTotal;
        },


    });

    return Model;

});