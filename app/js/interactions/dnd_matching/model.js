/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Player Model"
        },

        descriptions: {},
        numCompleted: 0,

        initialize: function(options){
            trace("moduleModel: init()");

            this.url = options.url;
            this.menuModel = options.menuModel;

            this.descriptions = {};
            this.numCompleted = 0;

            this.fetch({
                success: function () {
                    trace('module.model.fetch success');
                    this.onDataReady();
                }.bind(this)
            });
        },

        onDataReady: function () {

            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function() {
            // set initial values here
            var items = this.get('items');
            if(this.get('randomize')) {
                //items = _.shuffle(items);
            }
            this.set('items', items);
            this.items = new Backbone.Collection(this.get('items'));
        },

        setID: function (dropID, dragID) {
            if(this.descriptions[dropID] == undefined) {
                this.numCompleted = this.numCompleted + 1;
            }
            this.descriptions[dropID] = dragID;

            this.trigger('model:update', this.numCompleted == this.items.length)
        },

        unsetID: function (dropID, dragID) {
            if(this.descriptions[dropID] != undefined) {
                this.numCompleted = this.numCompleted - 1;
            }
            this.descriptions[dropID] = undefined;

            this.trigger('model:update', this.numCompleted == this.items.length)
        },

        getTitleForID: function (id) {
            /*this.items.find(function (item) {
                if (item.get('id') == id) {
                    return item.get('title');
                }
            })*/
            var items = this.items;
            var item = _.find(this.get('items'), function(item){
                return item.id == id;
            });
            trace('item: ', 4);
            trace(item, 4);
            return item.title;

        },

        resetCount: function () {
            this.descriptions = {};
            this.numCompleted = 0;
        },

        allCorrect: function () {
            var allCorrect = true;
            _.each(_.pairs(this.descriptions), function (pair) {
                if(pair[0] != pair[1]) {
                    allCorrect = false;
                }
            }.bind(this));

            return allCorrect;
        }

    });

    return Model;

});