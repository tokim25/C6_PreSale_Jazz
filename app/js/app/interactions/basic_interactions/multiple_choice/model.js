/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "MultipleChoice Model"
        },

        curIndex: -1,
        curQuestion: null,
        curChoice: null,
        curChoices: [],
        LOG_LEVEL: 5,

        initialize: function (options) {
            trace("moduleModel: init()");

            this.url = options.url || null;
            this.menuModel = options.menuModel || null;


            if(this.url) {
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
            this.numCompleted = 0;
            this.curIndex = -1;
        },

        nextQuestion: function (n) {

            var questions = this.get('items'),
                pattern, choices;

            this.curChoices = [];

            if(this.curIndex + n < questions.length) {
                this.curIndex += n;

                this.curQuestion = questions[this.curIndex];
                pattern = this.curQuestion.pattern;
                choices = this.curQuestion.choices.concat();

                if (this.curQuestion.type === 'sa') {
                    _.each(choices, function (choice, index) {
                        choice.result = pattern.indexOf(index) > -1 ? 'correct' : 'wrong';
                    });
                }else if (this.curQuestion.type === 'sequence') {
                    _.each(choices, function (choice, index) {
                        choice.index = index;
                    });
                } else {
                    _.each(choices, function (choice, index) {
                        choice.result = index == pattern ? 'correct' : 'wrong';
                    });
                }

                trace(this.curQuestion.choices, this.LOG_LEVEL);
                if(this.get('randomize') || this.curQuestion.randomize) {
                    this.curQuestion.choices = _.shuffle(this.curQuestion.choices);
                }
                trace(this.curQuestion.choices, this.LOG_LEVEL);
                this.trigger('model:update');

            } else {

                this.trigger('model:complete');

            }

            vent.trigger('update-jira', {'item':'question: ' + this.curIndex});

        },

        updateChoice: function (index) {
            this.curChoice = this.curQuestion.choices[index];
        },

        updateChoices: function (choice, val) {
            if(val) {
                this.curChoices.push(choice);
            } else {
                var index = this.curChoices.indexOf(choice);
                this.curChoices.splice(index, 1);
            }
        },

        isCorrect: function () {
            if (this.curQuestion.type === 'sa') {
                var choices = this.curChoices, i, choice,
                    totalCorrect = this.curQuestion.pattern.length;
                for (i = 0; i < choices.length; i++) {
                    choice = choices[i];
                    if (choice.result === 'wrong') {
                        return false;
                    }
                }
                if (choices.length < totalCorrect) {
                    return false;
                }

                return true;
            } else if (this.curQuestion.type === 'sequence') {
                return _.isEqual(this.sortedIDs, this.curQuestion.pattern);
            } else {
                return this.curChoice.result === 'correct'
            }
        },

        autoEnd: function () {
            var autoEnd = this.get('autoEnd');
            return autoEnd != undefined && autoEnd;
        },

        assetForID: function (id) {
            var manifest = this.get('assetManifest'),
                asset = _.find(manifest, function (item) {
                    return item.id == id;
                });

            return asset;
        }

    });

    return Model;

});