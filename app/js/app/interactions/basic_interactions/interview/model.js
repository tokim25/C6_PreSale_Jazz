/**
 * Created by jhoffsis on 7/19/17.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

  var Model = Backbone.Model.extend({

    defaults: {
      name: "Interview Model"
    },

    completed: [],
    index: 0,

    initialize: function (options) {
      trace("moduleModel: init()");

      this.url = options.url || null;
      this.menuModel = options.menuModel || null;


      if (this.url) {
        this.fetch({
          success: function () {
            trace('module.model.fetch success');
            this.onDataReady();
          }.bind(this)
        });
      } else {
        this.onDataReady();
      }

    },

    onDataReady: function () {

      this.reinitialize();
      this.trigger('model:init-complete');
    },

    reinitialize: function () {
      // set initial values here
      this.completed = [];
      this.index = 0;
      this.answer = this.get('answer');
      this.question = this.get('question');

      _.each(this.get('items'), function(item, index) {
        item.indexID = index;
      })

      if (this.get('randomize')) {
        this.set('items', _.shuffle(this.get('items')));
      }

      this.items = this.get('items');
    },

    getById: function (id) {
      var item = _.find(this.items, function (item) {
        return item.id == id;
      })

      return item;
    },
    getByIndex: function (index) {
      var item = _.find(this.items, function (item) {
        return item.indexID == index;
      })

      return item;
    },

    updateCompleted: function () {
      this.index = this.index + 1;
      this.trigger('model:update', this.index == this.items.length)
    },

    resetCount: function () {
      this.descriptions = {};
      this.index = 0;
    },

    allComplete: function () {
      return this.index == this.items.length;
    }

  });

  return Model;

});