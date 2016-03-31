/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
        "ui/splash",
    "text!templates/interactions/quiz_race_steps/mainview.html",
    "text!templates/ui/popup_sketchbox.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext, splashtext, conclusiontext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.quizwf-feedback-box',
            questionBox: '.quizwf-question-box',
            rolesBox: '.quizwf-roles-box',
            answerBox: '.quizwf-answer-box',
            answerChoice: '.quizwf-answer-choice.enabled',
            lines: '.quizwf-line',
            pedals: '.quizwf-pedal',
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
                'containerClass': 'marquee-hang-popup'
            }
            this.feedback = new Popup(textObj);
            this.listenTo(this.feedback, 'continue:clicked', this.checkAnswer);

            this.ui.feedbackContainer.append(this.feedback.render().el);

            var finalFeedbackObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'continue', 'label': 'OK'}],
                'containerClass': 'pick-popup'
            }
            this.finalFeedback = new Popup(finalFeedbackObj);
            this.listenTo(this.finalFeedback, 'continue:clicked', this.onFinalFeedbackDismissed);

            this.ui.feedbackContainer.append(this.finalFeedback.render().el);

            var splashObj = {
                colors: this.model.get('colors'),
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
                    colors: this.model.get('colors'),
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
            istenToOnce(this.conclusion, 'splash:complete', this.endInteraction);

            this.ui.scrim.hide();

            this.constructInteraction();

            this.$win = $(document);

            TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});
            TweenMax.set('.quizwf-answer-choice', {autoAlpha: 0.0});
            TweenMax.set(this.finalFeedback.$el.find('.popup-view'), {autoAlpha: 0.0, top: '0%'});
            TweenMax.set(this.feedback.$el.find('.popup-view'), {top: -850});

            TweenMax.set(this.ui.lines, {autoAlpha: 0});
            TweenMax.set(this.ui.lines.find('path'), {drawSVG: 0});
            TweenMax.set(this.ui.pedals, {autoAlpha: 0.0});

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();

            this.feedback.$el.show();
            this.finalFeedback.$el.show();

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
                $rolesDiv = this.ui.rolesBox.find('.content'),
                $answerDiv = this.ui.answerBox.find('.content'),
                $proto = this.$('.proto'),
                $choice;

            //TODO: Animate answer and question onto screen

            $answerDiv.empty();
            
            _.each(curQuestion.choices, function (choice, index) {
                $choice = $proto.clone();
                $choice.removeClass('proto');
                $choice.find('.content').html('<li>' + choice.text + '</li>')
                $choice.data('choice', choice);
                $choice.data('index', index);
                $answerDiv.append($choice);
                TweenMax.set($choice, {autoAlpha: 0.0})
            }.bind(this));

            $questionDiv.html(curQuestion.text);

            $rolesDiv.html(curQuestion.roles);
            TweenMax.set($rolesDiv.find('li'), {autoAlpha: 0.0});
            TweenMax.to(this.ui.rolesBox, 0.5, {autoAlpha: 1.0});

            setTimeout(function () {
                TweenMax.set(this.ui.questionBox, {autoAlpha: 1.0});
                var heightOffset = this.ui.questionBox.find('.content').height() + this.ui.questionBox.position().top;
                TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});

                //TweenMax.set(this.ui.answerChoice, {autoAlpha: 0.0});

                trace('heightOffset: ' + this.ui.questionBox.find('.content').height(), 4)

                this.ui.rolesBox.css('top', heightOffset + 30 + 'px');

                heightOffset += $rolesDiv.height();

                this.ui.answerBox.css('top', heightOffset + 50 + 'px');
                TweenMax.set(this.ui.questionBox, {rotationX: '-=180deg'});

                var tl = new TimelineMax();
                tl.add(TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '+=180deg', autoAlpha: 1.0}))
                    .add(TweenMax.staggerTo(this.ui.rolesBox.find('li'), 0.5, {delay: 0.5, autoAlpha: 1.0}, 0.4))
                    .add(TweenMax.staggerTo('.quizwf-answer-choice', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));
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
                    header: this.model.get('text').feedbackTitle[choice.result],
                    body: '<p>' + choice.feedback + '</p>'
                };

            $choice.addClass('selected').removeClass('enabled');

            this.$selectedChoice = $choice;

            this.model.updateChoice(index);

            this.showFeedback(feedbackObj, 0.2);

            vent.trigger('play_sfx', 'answer_click');

        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            // Interaction is complete
        },

        checkAnswer: function () {
            
            this.hideFeedback(0);
            
            if(this.model.isCorrect()) {
                this.doPedal();

            } else {
                this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
            }
        },

        doPedal: function () {
            var index = this.model.curIndex,
                $pedal = this.$('#quizwf-pedal' + index),
                $line = this.$('#quizwf-line' + index),
                $path = $line.find('path'),
                tl = new TimelineMax({onComplete: this.pedalComplete, onCompleteScope: this});

            tl.add(TweenMax.set($line, {autoAlpha: 1.0}))
                .add(TweenMax.to($path, 1.5, {drawSVG: '0 100%', ease: Power3.easeOut}))
                .add(TweenMax.set($pedal, {scale: 0.3}))
                .add(TweenMax.to($pedal, 0.5, {autoAlpha: 1.0, scale: 1.0, ease:Back.easeOut}), 1.3);

        },

        pedalComplete: function () {
            TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0});
            TweenMax.to(this.ui.rolesBox, 0.5, {autoAlpha: 0.0});
            TweenMax.staggerTo('.quizwf-answer-choice', 0.5, {autoAlpha: 0.0}, 0.2);

            setTimeout(function () {
                this.model.nextQuestion(1);
            }.bind(this), 2000);
        },

        showFeedback: function (content, delay) {
            delay = delay || 0;

            this.feedback.setText(content);

            var correct = this.model.isCorrect(),
                $popup = this.feedback.$el.find('.popup-view'),
                offset = this.$selectedChoice.offset(),
                leftPos = offset.left + this.$selectedChoice.width()-70,
                yPos = offset.top - 600;
            TweenMax.set($popup, {left: leftPos})
            TweenMax.to($popup, 0.5, {delay:delay, top: yPos + 'px', ease: Back.easeOut});

            if (correct) {
                $popup.removeClass('incorrect');
            } else {
                $popup.addClass('incorrect');
            }

            
            //TODO: size the scrim to $win dimensions, or include onresize method
            this.ui.scrim.fadeIn(300);
        },

        hideFeedback: function (delay) {
            
            delay = delay || 0;
            
            //this.feedback.$el.delay(delay).fadeOut();
            TweenMax.to(this.feedback.$el.find('.popup-view'), 0.5, {delay:delay, top: -850, ease: Power3.easeOut})
            
            this.ui.scrim.fadeOut(300);
        },

        showFinalFeedback: function (content) {

            var $line = this.ui.lines.last(),
                $path = $line.find('path'),
                $popup = this.finalFeedback.$el.find('.popup-view'),
                tl = new TimelineMax({onComplete: this.pedalComplete, onCompleteScope: this});

            tl.add(TweenMax.set($line, {autoAlpha: 1.0}))
                .add(TweenMax.to($path, 1.5, {drawSVG: '0 100%', ease: Power3.easeOut}))
                .add(TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 1.0, top: '50%', ease: Back.easeOut}));

            this.finalFeedback.setText(content);

            //TODO: size the scrim to $win dimensions, or include onresize method
            this.ui.scrim.fadeIn(300);
        },

        hideFinalFeedback: function (delay) {

            delay = delay || 0;

            //this.feedback.$el.delay(delay).fadeOut();
            TweenMax.to(this.finalFeedback.$el.find('.popup-view'), 0.5, {delay:delay, autoAlpha: 0.0, top: '0%'})

            this.ui.scrim.fadeOut(300);
        },

        onInteractionComplete: function () {
            //this.showFinalFeedback(this.showFinalFeedback(this.model.get('text').finalFeedback));
            var $line = this.ui.lines.last(),
                $path = $line.find('path'),
                tl = new TimelineMax({onComplete: this.showConclusion, onCompleteScope: this});

            tl.add(TweenMax.set($line, {autoAlpha: 1.0}))
                .add(TweenMax.to($path, 1.5, {drawSVG: '0 100%', ease: Power3.easeOut}));
            //this.showConclusion();
        },

        constructInteraction: function () {

        },

        onFinalFeedbackDismissed: function () {
            this.hideFinalFeedback(0);
            this.showConclusion();
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },


        onDestroy: function () {
        }


    });

});