
define(["backbone", "app/vent"], function (Backbone, vent) {
    var Model = Backbone.Model.extend({

        defaults: {
            name: "Player Model"
        },

        numCompleted: 0,
        currentItem: null,
        index: 0,

        initialize: function (options) {
            trace("moduleModel: init()");
            this.url = options.url;
            this.menuModel = options.menuModel;
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
            var k = 0,
                items = [], roles = this.get('roles'),
                positions = this.get('positions');

            _.each(roles, function (role) {
                i = 0;
                _.each(role.responsibilities, function (responsibility) {
                    responsibility.id = k++;
                    responsibility.roleID = role.id;
                    responsibility.droppedID = '';
                    items.push(responsibility);
                }.bind(this));
                role.positions = _.shuffle(positions.slice(0));
            }.bind(this));

            this.items = new Backbone.Collection(_.shuffle(items));
            this.roles = new Backbone.Collection(this.get('roles'));
            this.index = -1;
            this.currentItem = null;
        },

        getNextItem: function () {
            this.index++;
            this.currentItem = this.items.at(this.index);
            return this.currentItem;
        },

        setID: function (item, droppedID) {
            item.set('droppedID', droppedID);
            this.numCompleted++;
        },

        allComplete: function () {
            return this.numCompleted == this.items.length;
        },

        allCorrect: function () {
            var correct = _.filter(this.items.models, function (item) {
                    return item.get('roleID') == item.get('droppedID');
                });

            return correct.length == this.items.length;
        },

        numIncorrect: function () {
            var incorrect = _.filter(this.items.models, function (item) {
                return item.get('roleID') != item.get('droppedID');
            });

            return incorrect.length;
        },

        numTotal: function () {
            return this.items.models.length;
        },

        reset: function () {
            var incorrect = _.reject(this.items.models, function (item) {
                return item.get('roleID') == item.get('droppedID');
            });

            if(incorrect.length) {
                this.items = new Backbone.Collection(incorrect);
            }

            this.items.each(function(item) {
                item.set('droppedID', '');
            });

            this.numCompleted = 0;
            this.index = -1;
            this.currentItem = null;
        }

    });

    return Model;
});
