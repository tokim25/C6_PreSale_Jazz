/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "text!templates/interactions/quiz_race1/mainview.html",
    "text!templates/ui/popup_sketchbox.html"],
    function (Marionette, vent, Popup, text, popuptext, splashtext, conclusiontext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.quizcs-feedback-box',
            questionBox: '.quizcs-question-box',
            answerBox: '.quizcs-answer-box',
            answerChoice: '.quizcs-answer-choice.enabled',
            playerMe: '.quizcs-player-me',
            playerThem: '.quizcs-player-them',
            playerSelector: '.quizcs-player-selection-box',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.answerChoice.enabled': 'onChoiceClicked'
        },
        
        timerInterval: null,
        playerMe: {},
        playerThem: {},
        startTime: undefined,
        totalTime: undefined,
        percentComplete: undefined,
        pauseBeforeNextQuestion: undefined,

        initialize: function (options) {
            this.model = options.model;

            this.listenTo(this.model, 'model:update', this.onModelUpdate);
            this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

            this.timerInterval = null;
            this.playerMe = {
                startPos: 0,
                endPos: 700,
                distance: undefined,
                increment: undefined,
                startY: 50,
                angle: 0,
                addOn: 1.5,
                deltaAngle:0.08
            };
            this.playerThem = {
                startPos: 15,
                endPos: 710,
                distance:undefined,
                startY: 25,
                angle: 0.5,
                addOn: 2,
                deltaAngle:0.1
            };

            this.playerThem.distance = this.playerThem.endPos - this.playerThem.startPos;
            this.playerMe.distance = this.playerMe.endPos - this.playerMe.startPos;
            this.playerMe.increment = this.playerMe.distance / this.model.get('questions').length;
            
            this.startTime = undefined;
            this.totalTime = undefined;
            this.percentComplete = 1;
            this.pauseBeforeNextQuestion = this.model.get('pauseBeforeNextQuestion');
        },

        onRender: function () {
            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'continue', 'label': 'Got it!'}],
                //'containerClass': 'marquee-left-popup'
                'containerClass': 'marquee-hang-right-popup'
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
            this.listenTo(this.splash, 'splash:complete', this.showPlayers);


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

            this.ui.scrim.hide();
            this.ui.playerSelector.hide();

            this.constructInteraction();

            this.$win = $(document);

            TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});
            TweenMax.set('.quizcs-answer-choice', {autoAlpha: 0.0});
            TweenMax.set(this.finalFeedback.$el.find('.popup-view'), {autoAlpha: 0.0, top: '0%'});
            TweenMax.set(this.feedback.$el.find('.popup-view'), {top: -850});
            //this.ui.continueButton.removeClass('enabled').addClass('disabled')

            this.splash.$el.show();
        },

        showPlayers: function () {
            var $textbox = this.splash.$el.find('.splash-text-container'),
                $button = this.splash.$el.find('.popup-button');

            this.listenToOnce(this.splash, 'splash:complete', this.startInteraction);

            $button.html('Start Game');
            $textbox.fadeOut(function () {
                $textbox.replaceWith(this.ui.playerSelector);
                this.ui.playerSelector.fadeIn();
            }.bind(this));
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();

            this.feedback.$el.show();
            this.finalFeedback.$el.show();
            TweenMax.set(this.feedback.$el.find('.popup-view'), { left: '-600px', bottom: '200px'});

            this.model.reinitialize();
            setTimeout(function () {
                var date = new Date();

                this.totalTime = this.model.get('time');

                this.startTime = date.getTime();

                this.model.nextQuestion(1);

                this.timerInterval = setInterval(function () {
                    this.updateTime();
                }.bind(this), 10);

            }.bind(this), 1000);

            //this.ui.playerSelector.hide();
            this.trigger('mainview:activity-start');
        },

        onModelUpdate: function () {
            var curQuestion = this.model.curQuestion,
                $questionDiv = this.ui.questionBox.find('.content'),
                $answerDiv = this.ui.answerBox.find('.content'),
                $proto = this.$('.proto'),
                $choice, maxHeight = 0, $content;

            //TODO: Animate answer and question onto screen

            $answerDiv.empty();

            _.each(curQuestion.choices, function (choice, index) {
                $choice = $proto.clone();
                $choice.removeClass('proto');
                $content = $choice.find('.content');
                $content.html('<li>' + choice.text + '</li>')
                $choice.data('choice', choice);
                $choice.data('index', index);
                $answerDiv.append($choice);
                TweenMax.set($choice, {autoAlpha: 0.0});

            }.bind(this));




            $questionDiv.html(curQuestion.text);



            setTimeout(function () {
                TweenMax.set(this.ui.questionBox, {autoAlpha: 1.0});
                var heightOffset = this.ui.questionBox.find('.content').height() + this.ui.questionBox.position().top;
                TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});

                //TweenMax.set(this.ui.answerChoice, {autoAlpha: 0.0});
                TweenMax.set(this.ui.answerChoice, {autoAlpha: 1.0});
                this.$('.quizcs-answer-choice li').each(function () {
                    maxHeight = Math.max(maxHeight, $(this).height());
                });

                this.$('.quizcs-answer-choice li').height(maxHeight);

                TweenMax.set(this.ui.answerChoice, {autoAlpha: 0.0});


                //this.ui.answerChoice.find('li').height(maxHeight);
                trace('maxHeight: ' + maxHeight, 4)

                trace('heightOffset: ' + this.ui.questionBox.find('.content').height(), 4)

                this.ui.answerBox.css('top', heightOffset + 40 + 'px');
                TweenMax.set(this.ui.questionBox, {rotationX: '-=180deg'});
                TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '+=180deg', autoAlpha: 1.0});
                TweenMax.staggerTo('.quizcs-answer-choice', 0.5, {delay: 0.4, autoAlpha: 1.0}, 0.2);
            }.bind(this), 1000);



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
                var xPos = '+=' + this.playerMe.increment + 'px';
                TweenMax.to(this.ui.playerMe, 5, {left: xPos});

                TweenMax.to(this.ui.questionBox, 0.5, {delay: 0.3, autoAlpha: 0.0});
                TweenMax.staggerTo('.quizcs-answer-choice', 0.5, {autoAlpha: 0.0}, 0.2);

                setTimeout(function () {
                    this.model.nextQuestion(1);
                }.bind(this), 2000);
            } else {
                this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
            }
        },

        showFeedback: function (content, delay) {
            delay = delay || 0;

            this.feedback.setText(content);

            var correct = this.model.isCorrect(),
                $popup = this.feedback.$el.find('.popup-view'),
                offset = this.$selectedChoice.offset(),
                leftPos = offset.left - $popup.width(),
                yPos = offset.top - 560;
            TweenMax.set($popup, {left: leftPos})
            TweenMax.to($popup, 0.5, {delay:delay, top: yPos + 'px', ease: Back.easeOut});

            setTimeout(function () {
                vent.trigger('play_sfx', 'marquee');
                if (correct) {

                    vent.trigger('play_sfx', 'correct');
                }
            }.bind(this), delay*1000);
            /*var correct = this.model.isCorrect(),
                $popup = this.feedback.$el.find('.popup-view'),
                offset = this.$selectedChoice.offset(),
                leftPos = offset.left - $popup.width(),
                yPos = offset.top - 100;
            TweenMax.set($popup, {top: yPos + 100, left: '-700px'})
            TweenMax.to($popup, 0.5, {delay:delay, rotation: '+=7deg', left: leftPos + 'px', top: yPos + 'px', ease: Back.easeOut});*/

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
            //TweenMax.to(this.feedback.$el.find('.popup-view'), 0.5, {delay:delay, rotation: '-=7deg', left: '-700px', top: '-=100px', ease: Power3.easeOut})
            TweenMax.to(this.feedback.$el.find('.popup-view'), 0.5, {delay:delay, top: -850, ease: Power3.easeOut})

            this.ui.scrim.fadeOut(300);
        },

        showFinalFeedback: function (content, delay) {

            delay = delay || 0;

            this.finalFeedback.setText(content);

            var $popup = this.finalFeedback.$el.find('.popup-view');

            TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 1.0, top: '50%', ease: Back.easeOut})


            //TODO: size the scrim to $win dimensions, or include onresize method
            this.ui.scrim.fadeIn(300);
        },

        hideFinalFeedback: function (delay) {

            delay = delay || 0;

            //this.feedback.$el.delay(delay).fadeOut();
            TweenMax.to(this.finalFeedback.$el.find('.popup-view'), 0.5, {delay:delay, autoAlpha: 0.0, top: '0%'})

            this.ui.scrim.fadeOut(300);
        },

        updateTime: function () {
            var date = new Date(),
                elapsedTime = date.getTime() - this.startTime

            this.percentComplete = (elapsedTime / this.totalTime) ;

            if(elapsedTime >= this.totalTime) {
                this.stopRace();
            }else {
                this.animatePlayers();
            }
        },

        stopRace: function () {
            //if this is called, it means playerThem has won b/c time has run out
            clearInterval(this.timerInterval);
            setTimeout(function () {
                this.model.set('isWinner', false);
                this.showFinalFeedback(this.model.get('text').lose);
            }.bind(this), 1500);
        },

        animatePlayers: function () {
            var distance = this.playerThem.distance,
                travelled = distance * this.percentComplete,
                xPos = this.playerThem.startPos + travelled,
                yPos = this.playerThem.startY + this.playerThem.addOn*Math.cos(this.playerThem.angle += this.playerThem.deltaAngle);

            this.ui.playerThem.css({top: yPos, left:xPos});

            yPos = this.playerMe.startY + this.playerMe.addOn*Math.cos(this.playerMe.angle += this.playerMe.deltaAngle);
            this.ui.playerMe.css({top: yPos});
        },

        onInteractionComplete: function () {
            clearInterval(this.timerInterval);
            this.model.set('isWinner', true);
            this.showFinalFeedback(this.showFinalFeedback(this.model.get('text').win));
        },

        constructInteraction: function () {

        },

        onFinalFeedbackDismissed: function () {
            this.hideFinalFeedback(0);
            if (this.model.get('isWinner')) {
                this.showConclusion();
            } else {
                this.startInteraction();
            }
        },

        showConclusion: function () {
            this.conclusion.$el.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onDestroy: function () {
            clearInterval(this.timerInterval);
        }


    });

});