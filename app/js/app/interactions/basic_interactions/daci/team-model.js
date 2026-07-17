/**
 * Created by jhoffsis on 7/19/17.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "DACI Team Model"
        },

        descriptions: {},
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
            } else if (this.get('dependencies') != undefined) {
                this.loadRoles();
            } else {
                this.onDataReady();
            }

        },

        loadRoles: function () {
            var url = this.get('dependencies').rolesURL;
            $.ajax(url, {
                dataType: "json",
                success: function (data) {
                    this.alerts = data.alerts;
                    this.roles = data.roles;

                    this.loadScenario();
                    trace(data, 6);
                }.bind(this),
                error: function (e) {
                    trace("ERROR: " + e, 6);
                }.bind(this)
            });

        },

        loadScenario: function () {
            var url = this.get('dependencies').scenarioURL;
            $.ajax(url, {
                dataType: "json",
                success: function (data) {
                    this.people = data.people;
                    _.each(this.people, function (person) {
                        var role = this.roles[person.id];
                        person.selected = false;
                        _.extend(person, role);
                    }.bind(this));
                    this.set('people', this.people);
                    this.set('feedback', data.feedback);
                    this.set('scenario', data.scenario);
                    this.answers = data.answers;
                    this.onDataReady();
                }.bind(this),
                error: function (e) {
                    trace("ERROR: " + e, 6);
                }.bind(this)
            });
        },

        onDataReady: function () {

            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function () {
            // set initial values here
            this.descriptions = {};
            this.index = 0;

            _.each(this.get('items'), function (item, index) {
                item.indexID = index;
            })

            if (this.get('randomize')) {
                this.set('items', _.shuffle(this.get('items')));
            }

            this.items = this.get('items');
        },

        updateSelected: function (id) {
            var person = _.find(this.people, {id: id});
            person.selected = !person.selected;
        },

        clearSelected: function (id) {
            _.each(this.people, function (person) {person.selected = false;});
        },

        updateCompleted: function () {
            this.index = this.index + 1;
            this.trigger('model:update', this.index == this.items.length)
        },

        resetCount: function () {
            this.descriptions = {};
            this.index = 0;
        },

        getFeedback: function () {
            var feedback = [];
            _.each(this.people, function (person) {
                if (person.selected != person.member) {
                    feedback.push(person.feedback);
                }
            });

            return feedback;
        },

        allCorrect:function () {
            var feedback = this.getFeedback();
            return feedback.length == 0;
        },

        allComplete: function () {
            return this.index == this.items.length;
        }

    });

    return Model;

});