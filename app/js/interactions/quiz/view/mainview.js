/**
 * Created by jhoffsis on 7/13/15.
 */

define( ['marionette', 'text!templates/interactions/quiz/mainview.html', 'app/vent', 'interactions/quiz/view/questionview'], function (Marionette, text, vent, QuestionView) {
    var View = Marionette.ItemView.extend({

        template : text,

        ui: {
            //
        },

        events : {
            
        },

        modelEvents: {
            'model:question-updated': 'onQuestionUpdated',
            'model:activity-complete': 'onActivityComplete'
        },

        questionView: null,
        questionViewInitialized: false,

        initialize: function (options) {
            trace('quiz.mainview: initialize()');
            this.model = options.model;
            this.listenTo(this.model, 'model:question-updated', this.onQuestionUpdated);
            this.listenTo(this.model, 'model:activity-complete', this.onActivityComplete);
            
            this.questionView = new QuestionView();
            this.listenTo(this.questionView, 'choice-clicked', this.onChoiceClicked);
            this.listenTo(this.questionView, 'submit-clicked', this.onSubmitClicked);
            this.listenTo(this.questionView, 'feedback-dismissed', this.onFeedbackDismissed);
            this.listenTo(this.questionView, 'interval', this.onInterval);
        },

        onInterval: function () {
            trace('__Handling interval__', 1);
        },

        onRender: function() {
            trace('mainview: onRender()');
            
            this.model.nextQuestion();
        },


        onChoiceClicked: function (index) {
            this.model.updateChoice(index);
            

        },  

        onSubmitClicked: function () {

            this.model.commitChoice();

            var choice = this.model.get('currentChoice');
            if(choice.feedback != null) {
                this.ui.feedbackBox.find('.content').html('<p>' + choice.feedback + '</p>');

                this.showFeedback(true, 1.5);
            } else {
                this.model.nextQuestion();
            }
        },

        onFeedbackDismissed: function () {
            var maxAttempts = this.model.get('maxAttempts'),
                attempts = this.model.get('attempts');

            this.showFeedback(false);

            if(attempts < maxAttempts) {
                // update the question view
                this.updateQuestionView();
            } else {
                this.model.nextQuestion();
            }

        },

        updateQuestionView: function () {
            var choice = this.model.get('currentChoice');

            if(choice.result == 'correct') {
                this.showQuestion(false);
                setTimeout(function () {
                    this.model.nextQuestion();
                }.bind(this), 500);
            } else {
                this.questionView.disableSelectedChoice();
            }
        },

        onQuestionUpdated: function () {
            var question = this.model.get('currentQuestion');
            
            this.questionView.model = question;
            
            if (!this.questionViewInitialized) {
                this.questionViewInitialized = true;
                this.$('#quiz-question-container').append(this.questionView.render().el);
                this.showQuestion(false, 0);
            } else {
                this.questionView.render();
            }

            //get a reference to coachBox
            this.ui.feedbackBox = this.questionView.ui.feedbackBox;

            this.showQuestion(true);
            
        },

        showQuestion: function (bool) {
            if(bool) {
                this.questionView.ui.quesContainer.fadeIn();
            } else {
                this.questionView.ui.quesContainer.fadeOut();
            }
        },

        showFeedback: function (bool, delay) {
            var delay = delay || 0;
            if(bool) {
                this.ui.feedbackBox.delay(delay).fadeIn();
            } else {
                this.ui.feedbackBox.delay(delay).fadeOut();
            }
        },

        onActivityComplete: function () {
            this.trigger('mainview:activity-complete')
        },

        onDestroy: function () {
            this.questionView.destroy();
        }
    });
    
    return View;

});