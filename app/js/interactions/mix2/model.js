/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Workflows Model"
        },

        completed: null,
        numCompleted: 0,
        totalItems: 0,
        currentRole: null,

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

            var labels = this.get('text').labels;
            this.roles = new Backbone.Collection(this.get('roles'));

            this.totalItems = this.roles.length * labels.phases.length;

            this.completed = {};
            this.currentRole = null;
        },

        setPhase: function (phaseID) {
            var roleObj = this.completed[this.currentRole];

            if (roleObj[phaseID] == undefined) {
                roleObj[phaseID] = true;
                this.numCompleted = this.numCompleted + 1;
                vent.trigger('update-jira', {'item':'numCompleted: ' + this.numCompleted});
            }

            this.trigger('model:update', Object.keys(roleObj).length, this.numCompleted == this.totalItems);

            return this.getRoleText(this.currentRole, phaseID);
        },

        setRole: function (roleID) {
            if (this.completed[roleID] == undefined) {
                this.completed[roleID] = {};
            }

            this.currentRole = roleID;

        },

        getRoleText: function (roleID, phaseID) {
            var role = this.roles.get(roleID),
                phases = role.get('phases'),
                phase = phases[phaseID], textObj = {};

            textObj.body = '<h2>' + phase.header + '</h2>' + phase.body;
            textObj.header = role.get('label');

            return textObj;
        }


    });

    return Model;

});