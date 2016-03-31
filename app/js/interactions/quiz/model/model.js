/**
 * Created by jhoffsis on 7/13/15.
 */

define(['backbone', 'app/vent'], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: 'Quiz Model',
            randomize: false,
            maxAttempts: 1,
            attempts: 0
        },

        curIndex: 0,
        questions: null,
        quizData: null,

        initialize: function(options){
            trace('moduleModel: init()');
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
            var questions = this.get('questions');
            if(this.get('randomize')) {
                questions = _.shuffle(questions);
            }

            var Question = Backbone.Model.extend({
                    defaults: {
                        'id': '',
                        'type': '',
                        'text': '',
                        'result': '',
                        'student_response': '',
                        'time': '',
                        'latency': '',
                        'weighting': '',
                        'correct_responses.0.pattern': '',
                        'objectives.0.id': ''
                    }
                }),
                QuesCollection = Backbone.Collection.extend({model:Question})

            this.questions = new QuesCollection(questions);

            this.quizData = new Backbone.Collection();

            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function() {
            curIndex = 0;
        },

        nextQuestion: function () {
            if(this.curIndex < this.questions.length) {
                var question = this.questions.at(this.curIndex);
                question.set('id', this.curIndex);
                this.set('currentQuestion', question);
                this.trigger('model:question-updated');
                this.attempts = 0;
                this.curIndex ++;
            }else {
                this.trigger('model:activity-complete');


            }
        },

        updateChoice: function (index) {
            var question = this.get('currentQuestion');
            var currentChoice = question.get('choices')[index];
            currentChoice.id = index;

            this.set('currentChoice', currentChoice);
        },

        commitChoice: function () {
            this.setQuestionData();
            this.set('attempts', this.get('attempts') + 1);
        },

        setQuestionData: function () {
            var question = this.get('currentQuestion'),
                choice = this.get('currentChoice'),
                id = question.get('id'),
                d = new Date(),
                time_string = d.toTimeString().split(' ')[0],
                questionData = {
                    'id': id,
                    'type': question.get('type'),
                    'text': question.get('text'),
                    'correct_responses.0.pattern': question.get('pattern'),
                    'student_response': choice.id,
                    'result': choice.result,
                    'time': time_string
                };

            //var data = new Backbone.Model({'questionData': questionData, id: id});
            this.quizData.add(questionData)
        }


    });

    return Model;

});