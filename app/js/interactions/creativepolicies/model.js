/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Module Model"
        },

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
            var ctas = this.get('callstoaction');
            ctas = _.shuffle(ctas);
            this.set('callstoaction', ctas);
            this.ctas = new Backbone.Collection(ctas);
        },

        updateChoice: function (dataID) {
            this.curChoice = this.ctas.get(dataID);
            vent.trigger('update-jira', {'item':'cta: ' + dataID});
        },

        isCorrect: function () {
            return this.curChoice.get('result') === 'correct';
        }


    });

    return Model;

});