/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Hotspots Model"
        },

        completed: null,
        numCompleted: 0,
        totalItems: 0,
        currentItem: null,
        currentDetail: null,

        initialize: function (options) {
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

        reinitialize: function () {
            // set initial values here

            this.items = new Backbone.Collection(this.get('items'));
            this.totalItems = 0;

            this.items.forEach(function(item, i) {
                this.totalItems += item.get('details').length;
                _.each(item.get('details'), function (detail, j) {
                    detail.id = j;
                })
            }.bind(this));

            this.completed = {};
            this.currentItem = null;
            this.currentDetail = null;
        },

        setItem: function (itemID) {
            if (this.completed[itemID] == undefined) {
                this.completed[itemID] = {};
            }

            this.currentItem = itemID;
            this.currentDetail = null;

        },

        setDetail: function (detailID) {
            var itemObj = this.completed[this.currentItem];

            if (itemObj[detailID] == undefined) {
                itemObj[detailID] = true;
                this.numCompleted = this.numCompleted + 1;
                vent.trigger('update-jira', {'item':'numCompleted: ' + this.numCompleted});
            }

            this.currentDetail = detailID;

        },

        getDetail: function () {
            var item = this.items.get(this.currentItem),
                details = item.get('details'),
                detail = details[this.currentDetail], textObj = {};

            return detail;
        },

        getDetailForID: function (detailID) {
            var item = this.items.get(this.currentItem),
                details = item.get('details'),
                detail = details[detailID], textObj = {};

            return detail;
        },

        setComplete: function () {
            var nTotalInSet =this.items.get(this.currentItem).get('details').length,
                nCompletedInSet = _.size(this.completed[this.currentItem]);

            return (nCompletedInSet >= nTotalInSet);
        },

        allComplete: function () {
            return this.numCompleted == this.totalItems;
        },

        getDetailText: function () {
            var item = this.items.get(this.currentItem),
                details = item.get('details'),
                index = parseInt(this.currentDetail),
                detail = details[index], textObj = {};

            textObj.body = '<h2>' + detail.header + '</h2>' + detail.body;
            textObj.header = item.get('label');

            return textObj;
        }


    });

    return Model;

});