/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Cassette Model"
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
            this.descriptions = {};
            this.numCompleted = 0;
            this.numTotal = 0;
            this.elements = new Backbone.Collection(this.get('elements'))
            this.numTotal = this.get('elements').length;
        },

        setID: function (dragID) {
            if(this.descriptions[dragID] == undefined) {
                this.numCompleted = this.numCompleted + 1;
                vent.trigger('update-jira', {'item':'numCompleted: ' + this.numCompleted});
            }
            this.descriptions[dragID] = true;

            this.trigger('model:update', this.numCompleted >= this.numTotal)
        }


    });

    return Model;

});