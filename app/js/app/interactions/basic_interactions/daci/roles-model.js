/**
 * Created by jhoffsis on 7/19/17.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "DACI Roles Model"
        },

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
                        person.selectedRole = null;
                        _.extend(person, role);
                    }.bind(this));
                    this.people = _.filter(this.people, function (p) {return p.member});
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

        },

        updateSelected: function (id, role_id) {
            var person = _.find(this.people, {id: id});
            if (person.selectedRole != role_id) {
                person.selectedRole = role_id;
            } else {
                person.selectedRole = null;
            }
            person.selected = person.selectedRole != null;
            this.updateCompleted();
        },

        updateCompleted: function () {
            this.index = this.index + 1;
            this.trigger('model:update', this.allSelected())
        },

        allSelected: function () {
            return _.every(this.people, function(p) {return p.selectedRole != null});
        },

        clearSelected: function (id) {
            _.each(this.people, function (person) {person.selected = false; person.selectedRole = null;});
        },

        selectCorrect: function () {
            _.each(this.people, function (person) {
                var role = _.findKey(person.role_feedback, function(r) {return r == "";});
                person.selectedRole = role;
                person.selected = true;
            });
        },

        resetCount: function () {
            this.descriptions = {};
            this.index = 0;
        },

        getAlert: function () {
            var drivers = _.where(this.people, {selectedRole: "d"}).length,
                approvers = _.where(this.people, {selectedRole: "a"}).length;
            if(drivers > 1) {
                return this.alerts.multipleD;
            } else if (drivers < 1) {
                return this.alerts.noD;
            } else if (approvers > 1) {
                return this.alerts.multipleA;
            } else if (approvers < 1) {
                return this.alerts.noA;
            }

            return null;
        },

        getFeedback: function () {
            var feedback = [];
            _.each(this.people, function (person) {
                var fb = person.role_feedback[person.selectedRole];
                if (fb != '' && person.selectedRole != null) {
                    feedback.push({
                        id: person.handle,
                        name: person.name,
                        feedback: fb
                    });
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