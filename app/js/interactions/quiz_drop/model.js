/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Workflows Model"
        },

        curIndex: -1,
        curQuestion: null,
        curChoice: null,
        isWinner: false,

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

            this.set('modulename', this.menuModel.get('moduleName').toLowerCase());
            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function () {
            // set initial values here
            this.curIndex = -1;
        },

        nextQuestion: function (n) {

            var questions = this.get('questions');

            if(this.curIndex + n < questions.length) {
                this.curIndex += n;

                this.curQuestion = questions[this.curIndex];
                if(this.get('randomize')) {
                    this.curQuestion.choices = _.shuffle(this.curQuestion.choices);
                }
                this.trigger('model:update');

            } else {

                this.trigger('model:complete');

            }

            vent.trigger('update-jira', {'item':'question: ' + this.curIndex});

        },

        updateChoice: function (index) {
            this.curChoice = this.curQuestion.choices[index];
        },

        isCorrect: function () {
            return this.curChoice.result === 'correct'
        }

    });

    return Model;

});