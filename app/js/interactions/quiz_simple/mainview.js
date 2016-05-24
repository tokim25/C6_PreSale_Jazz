/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
        "app/vent",
        "ui/popup",
        "ui/splash",
        "text!templates/interactions/quiz_simple/mainview.html",
        "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
        return Marionette.ItemView.extend({

            template: text,

            ui: {
                //
                splashContainer: '.splash-container',
                conclusionContainer: '.conclusion-container',
                feedbackContainer: '.introqz-feedback-box',
                scenarioBox: '.introqz-scenario-container',
                questionBox: '.introqz-question-box',
                answerBox: '.introqz-answer-box',
                answerChoice: '.introqz-answer-choice.enabled',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.continueButton': 'onButtonClicked',
                'click @ui.answerChoice.enabled': 'onChoiceClicked'
            },

            initialize: function (options) {
                this.model = options.model;

                this.listenTo(this.model, 'model:update', this.onModelUpdate);
                this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

            },

            onRender: function () {
                var textObj = {
                    'template': popuptext,
                    'showTitle': true,
                    'title': '',
                    'body': '',
                    'buttons': [{'id': 'continue', 'label': 'Got it!'}],
                    'containerClass': 'blob4-popup'
                }
                this.feedback = new Popup(textObj);
                this.listenTo(this.feedback, 'continue:clicked', this.checkAnswer);

                this.ui.feedbackContainer.append(this.feedback.render().el);

                var splashObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'splash',
                    elements: this.model.get('text').splash.slice(),
                    buttons: [{'id': 'continue', 'label': 'Next'}],
                    containerClass: 'splash-popup'
                }
                this.splash = new Splash({model: new Backbone.Model(splashObj)});
                this.ui.splashContainer.append(this.splash.render().el);
                this.listenTo(this.splash, 'splash:complete', this.startInteraction);

                if (this.model.get('text').conclusion != undefined) {
                    var conclObj = {
                        bg_info: this.model.get('bg_info'),
                        name: this.model.get('name'),
                        modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                        template: 'conclusion',
                        badge: this.model.get('menuModel').get('badge'),
                        elements: this.model.get('text').conclusion.slice(),
                        buttons: [{'id': 'continue', 'label': 'Continue'}],
                        containerClass: 'splash-popup'
                    };

                    this.conclusion = new Splash({model: new Backbone.Model(conclObj)});
                    this.ui.conclusionContainer.append(this.conclusion.render().el);
                    this.listenToOnce(this.conclusion, 'splash:complete', this.endInteraction);
                }

                this.ui.scrim.hide();

                this.constructInteraction();

                this.$win = $(document);

                TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});
                TweenMax.set('.introqz-answer-choice', {autoAlpha: 0.0});
                TweenMax.set(this.feedback.$el.find('.popup-view'), {autoAlpha: 0.0});

                this.splash.show();
            },

            startInteraction: function () {
                this.splash.$el.fadeOut();

                this.feedback.$el.show();

                this.model.reinitialize();

                this.model.nextQuestion(1);

                this.trigger('mainview:activity-start');

            },

            showConclusion: function () {
                this.conclusion.fadeIn();
                this.trigger('mainview:show-conclusion');
            },

            endInteraction: function () {
                this.trigger('mainview:activity-complete');
            },

            onModelUpdate: function () {
                var curQuestion = this.model.curQuestion,
                    $questionDiv = this.ui.questionBox.find('.content'),
                    $answerDiv = this.ui.answerBox.find('.content'),
                    $proto = this.$('.proto'),
                    $choice, letters = ["A:", "B:", "C:", "D:"],
                    scenarioText = 'Scenario ' + (this.model.curIndex + 1);


                this.ui.scenarioBox.find('h1').html(scenarioText);
                this.ui.scenarioBox.find('p').html(curQuestion.scenario);

                this.tl_enter = new TimelineMax();
                this.tl_enter.fromTo(this.ui.scenarioBox.find('.content'), 0.5, {scale: 0.4, transformOrigin: '50% 50%'}, {scale: 1, transformOrigin: '50% 50%',autoAlpha: 1.0, ease:Back.easeOut});

                $answerDiv.empty();

                _.each(curQuestion.choices, function (choice, index) {
                    $choice = $proto.clone();
                    $choice.removeClass('proto');
                    $choice.html('<span class="introqz-answer-letter">' + letters[index] +'</span><p>' + choice.text + '</p>')
                    $choice.data('choice', choice);
                    $choice.data('index', index);
                    $answerDiv.append($choice);
                    TweenMax.set($choice, {autoAlpha: 0.0});
                }.bind(this));

                $questionDiv.html(curQuestion.text);

                this.numWrong = 0;

                TweenMax.set(this.ui.questionBox, {rotationX: '-180deg'});

                setTimeout(function () {
                    TweenMax.set(this.ui.questionBox, {autoAlpha: 1.0});
                    var heightOffset = this.ui.questionBox.find('.content').height() + this.ui.questionBox.position().top,
                        maxHeight = 0;
                    TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});

                    // Ensure all the answer choices are of the same height
                    /*TweenMax.set(this.ui.answerChoice, {autoAlpha: 1.0});
                    this.$('.introqz-answer.enabled p').each(function () {
                        maxHeight = Math.max(maxHeight, $(this).height());
                    });

                    this.$('.introqz-answer.enabled p').height(maxHeight);*/


                    this.ui.answerBox.css('top', heightOffset + 25 + 'px');

                    this.tl_enter.add(TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '0deg', autoAlpha: 1.0}), '+=.5')
                        .add(TweenMax.staggerTo('.introqz-answer', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));
                }.bind(this), 100);



            },

            nextQuestion: function () {
                this.model.nextQuestion(1);
            },

            onChoiceClicked: function (e) {
                var $choice = $(e.currentTarget),
                    choice = $choice.data('choice'),
                    index = $choice.data('index'),
                    feedbackObj = {
                        header: choice.feedback.title,
                        body: '<p>' + choice.feedback.body + '</p>'
                    };

                $choice.addClass('selected').removeClass('enabled');

                this.$selectedChoice = $choice;

                this.model.updateChoice(index);

                this.showFeedback(feedbackObj, 0.35);

                vent.trigger('play_sfx', 'answer_click');

            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');

                vent.trigger('play_sfx', 'button_click');

                // Interaction is complete
            },

            checkAnswer: function () {

                this.hideFeedback(0);

                if(this.model.isCorrect()) {
                    this.tl_leave = new TimelineMax({

                    })
                    this.tl_leave.add(TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0}))
                        .add(TweenMax.staggerTo('.introqz-answer', 0.5, {autoAlpha: 0.0}, 0.2))
                        .add(TweenMax.to(this.ui.scenarioBox.find('.content'), 0.5, {autoAlpha: 0.0}))
                        .addCallback(this.nextQuestion, '+=.5', [], this);
                } else {
                    this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
                }
            },

            showFeedback: function (content, delay) {
                delay = delay || 0;

                this.feedback.setText(content);

                var correct = this.model.isCorrect(),
                    $popup = this.feedback.$el.find('.popup-view');

                if(correct) {
                    $popup.addClass('correct');
                } else {
                    $popup.removeClass('correct');
                }

                TweenMax.set($popup, {scale: 0.5})
                TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 1.0, scale: 1.0, ease: Back.easeOut});

                setTimeout(function () {
                    vent.trigger('play_sfx', 'popup');
                }.bind(this), delay*1000);

                //TODO: size the scrim to $win dimensions, or include onresize method
                this.ui.scrim.fadeIn(300);
            },

            hideFeedback: function (delay) {

                delay = delay || 0;

                var $popup = this.feedback.$el.find('.popup-view');

                $popup.removeClass('correct');
                TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 0.0, ease: Power3.easeOut})

                this.ui.scrim.fadeOut(300);
            },

            onInteractionComplete: function () {
                this.showConclusion();

            },

            constructInteraction: function () {

            },

            onDestroy: function () {
                if(this.tl_leave) {
                    this.tl_leave.kill();
                }
                if(this.tl_enter) {
                    this.tl_enter.kill();
                }

            }


        });

    });