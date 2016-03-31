/**
 * Created by jhoffsis on 8/3/15.
 */


define(['marionette', 'jquery', 'tweenmax', 'app/vent', 'text!templates/interactions/quiz/questionview.html'], function (Marionette, $, TweenMax, vent, text) {

    var QuestionView = Marionette.ItemView.extend({

        template: text,

        ui: {
            quesContainer: '#quiz-choice-box',
            feedbackBox: '#quiz-feedback-box',
            submitButton: '#quiz-submit-button',
            continueButton: '#quiz-feedback-continue-button'
        },

        events : {
            'click .quiz-choice.enabled': 'onChoiceClicked',
            'click @ui.submitButton': 'onSubmitClicked',
            'click @ui.continueButton': 'onFeedbackDismissed'
        },

        initialize: function (options) {

            this.$selectedChoice = null;
        },

        onRender: function() {
            trace("questionview: onRender()");

            this.ui.feedbackBox.hide();

            return this;
        },

        onShow: function () {
            this.ui.submitButton.tooltip({
                text: "What a nice mouse you have."
            });
        },

        onSubmitClicked: function () {
            this.$selectedChoice.removeClass('enabled');
            this.trigger('submit-clicked');
        },

        onChoiceClicked: function (e) {
            var $choice = this.$(e.currentTarget),
                index = parseInt($choice.attr('data-id'));

            this.$selectedChoice = $choice;


            if(this.model.get('type') === 'choice') {
                this.$('.quiz-choice').removeClass('selected');
            }

            $choice.addClass('selected');

            //this.enableChoices(false)
            this.trigger('choice-clicked', index);
        },

        onFeedbackDismissed: function () {
            this.trigger('feedback-dismissed');
        },

        enableChoices: function (b) {
            if(b) {
                $(".quiz-choice" ).each( function(i, choice) {
                    var $choice = $(choice);
                    if(!$choice.hasClass('disabled')) {
                        $choice.addClass('enabled');
                    }
                });
            }else {
                $('.quiz-choice').removeClass('enabled');
            }
        },

        disableSelectedChoice: function () {
            if(!this.$selectedChoice) return;

            if (this.$selectedChoice.hasClass('selected') === true) {
                this.$selectedChoice.removeClass('selected enabled').addClass('disabled');
            }
            this.$selectedChoice = null;
        },

        disableNonSelectedChoice: function () {
            $(".quiz-choice").each( function(i, choice) {
                var $choice = $(choice);
                if($choice.attr('id') !== this.$selectedChoice.attr('id')) {
                    $choice.removeClass('enabled').addClass('disabled');
                }
            }).bind(this);

        },

        onDestroy: function () {

        }
    });

    return QuestionView;

});