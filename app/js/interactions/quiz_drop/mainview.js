/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
        "app/vent",
        "ui/popup",
        "ui/splash",
        "text!templates/interactions/quiz_drop/mainview.html",
        "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext, splashtext, conclusiontext) {
        return Marionette.ItemView.extend({

            template: text,

            ui: {
                //
                splashContainer: '.splash-container',
                conclusionContainer: '.conclusion-container',
                feedbackContainer: '.gofish-feedback-box',
                questionBox: '.gofish-question-box',
                shoelace: '#gofish-shoelace',
                answerBox: '.gofish-answer-box',
                answerChoice: '.gofish-answer-choice.enabled',
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
                    'containerClass': 'blob1-popup'
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
                TweenMax.set('.gofish-answer-choice', {autoAlpha: 0.0});
                TweenMax.set(this.feedback.$el.find('.popup-view'), {autoAlpha: 0.0});

                this.splash.show();
            },


            startInteraction: function () {
                this.splash.$el.fadeOut();

                this.feedback.$el.show();

                this.model.reinitialize();

                this.model.nextQuestion(1);

                this.animationID = requestAnimationFrame(this.animate.bind(this));

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
                    $choice, letters = ["A:", "B:", "C:", "D:"];;

                //TODO: Animate answer and question onto screen

                $answerDiv.empty();

                _.each(curQuestion.choices, function (choice, index) {
                    $choice = $proto.clone();
                    $choice.removeClass('proto');
                    $choice.html('<span class="gofish-answer-letter">' + letters[index] +'</span><p>' + choice.text + '</p>')
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
                    TweenMax.set(this.ui.answerChoice, {autoAlpha: 1.0});
                    this.$('.gofish-answer.enabled p').each(function () {
                        maxHeight = Math.max(maxHeight, $(this).height());
                    });

                    this.$('.gofish-answer.enabled p').height(maxHeight);


                    this.ui.answerBox.css('top', heightOffset + 25 + 'px');

                    var tl = new TimelineMax();
                    tl.add(TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '0deg', autoAlpha: 1.0}))
                        .add(TweenMax.staggerTo('.gofish-answer', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));
                }.bind(this), 100);



            },

            nextQuestion: function () {
                this.model.nextQuestion(1);
            },

            onChoiceClicked: function (e) {
                var $choice = $(e.currentTarget),
                    choice = $choice.data('choice'),
                    index = $choice.data('index'),
                    /*feedbackObj = {
                        header: this.model.get('text').feedbackTitle[choice.result],
                        body: '<p>' + choice.feedback + '</p>'
                    };*/
                    feedbackObj = {
                        header: choice.feedback.title,
                        body: '<p>' + choice.feedback.body + '</p>'
                    };

                $choice.addClass('selected').removeClass('enabled');

                this.$selectedChoice = $choice;

                this.model.updateChoice(index);

                this.showFeedback(feedbackObj, 0.35);

                //TODO: remove the following. Leaving in for now because moved this funcitonality into feedback continue button

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
                    TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0});
                    TweenMax.staggerTo('.gofish-answer', 0.5, {autoAlpha: 0.0}, 0.2);
                    setTimeout(function () {
                        this.nextQuestion();
                    }.bind(this), 2500);;
                    this.animateShoelace(true);
                } else {
                    this.animateShoelace(false);
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
                }

                TweenMax.set($popup, {scale: 0.7})
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
                //this.showFinalFeedback(this.showFinalFeedback(this.model.get('text').finalFeedback));

                this.ui.shoelace.find('#shoelace').addClass('completed');
                this.$('#gofish-cassette').hide();
                TweenMax.to(this.ui.shoelace, 1.7, {top: -500, ease:"Back.easeOut", onComplete: this.onFinalAnimComplete, onCompleteScope: this});
                
            },

            onFinalAnimComplete: function () {
                setTimeout( function () {
                    this.showConclusion();
                }.bind(this), 3000)
            },

            constructInteraction: function () {
                this.timerInterval = null;
                this.animationID = null;
                this.distractorIndex = 0;

                this.totalDist = $(document).height() - 350; //this is the total distance shoelace will travel to get the cassette;
                this.distPerQuestion = this.totalDist / this.model.get('questions').length;
                this.distPerIncorrect = 30;
                this.numWrong = 0;  // used to figure out how far forward to move shoelace after a correct choice
                                    // i.e., px to move shoelace = distPerQuestion + (numWrong * distPerIncorrect)


                setTimeout(function () {
                    this.waveObj1 = {$el:this.$('#gofish-wave1'), angle: 0, startY: this.$('#gofish-wave1').position().top , addOn: 3, deltaAngle: 0.03};
                    this.waveObj2 = {$el:this.$('#gofish-wave2'), angle: 0.5, startY: this.$('#gofish-wave2').position().top, addOn: 4, deltaAngle: 0.04};
                    this.waveObj3 = {$el:this.$('#gofish-wave3'), angle: 0.75, startY: this.$('#gofish-wave3').position().top, addOn: 5, deltaAngle: 0.05};
                    this.waveObj4 = {$el:this.$('#gofish-wave4'), angle: 1.0, startY: this.$('#gofish-wave4').position().top, addOn:3, deltaAngle: 0.07};

                    this.distObj1 = {$el:this.$('#gofish-distractor1'), angle: 0, startY: this.$('#gofish-distractor1').position().top, startX: 400, speed: .15, addOn: 1, deltaAngle: 0.03};
                    this.distObj2 = {$el:this.$('#gofish-distractor2'), angle: 0.5, startY: this.$('#gofish-distractor2').position().top, startX: 850, speed: .16, addOn: 1, deltaAngle: 0.04};
                    this.distObj3 = {$el:this.$('#gofish-distractor3'), angle: 0.75, startY: this.$('#gofish-distractor3').position().top, startX: 1450, speed: .18, addOn: 1, deltaAngle: 0.05};
                    this.distObj4 = {$el:this.$('#gofish-distractor4'), angle: 0, startY: this.$('#gofish-distractor4').position().top, startX: 300, speed: .21, addOn: 1, deltaAngle: 0.03};
                    this.distObj5 = {$el:this.$('#gofish-distractor5'), angle: 0.5, startY: this.$('#gofish-distractor5').position().top, startX: 750, speed: .19, addOn: 1, deltaAngle: 0.04};
                    this.distObj6 = {$el:this.$('#gofish-distractor6'), angle: 0.75, startY: this.$('#gofish-distractor6').position().top, startX: 1300, speed: .18, addOn: 1, deltaAngle: 0.05};

                    this.distObj7 = {$el:this.$('#gofish-cassette'), angle: 0.75, startY: this.$('#gofish-cassette').position().top, startX: 950, speed: 0, addOn: 3, deltaAngle: 0.05};
                    this.distObj8 = {$el:this.$('#shoelace'), angle: 0.0, startY: this.$('#shoelace').position().top, startX: 0, speed: 0, addOn:2, deltaAngle: 0.09};

                    var i = 1, obj;

                    for (; i<=6; i++) {
                        obj = this['distObj' + i];
                        this.placeDistractor(obj)
                    }

                }.bind(this), 500);

            },

            placeDistractor: function (obj) {
                obj.$el.css(
                    {
                        'background-position': -(215 * this.distractorIndex),
                        'left': obj.startX
                    });
                this.distractorIndex = (this.distractorIndex + 1) % 9;
            },

            animateShoelace: function (isCorrect) {
                var top = this.ui.shoelace.position().top,
                    distance;

                if(isCorrect) {
                    distance = this.distPerQuestion + (this.numWrong * this.distPerIncorrect);

                }else {
                    this.numWrong ++;
                    distance = - this.distPerIncorrect;
                }
                TweenMax.to(this.ui.shoelace, 4, {top: (top + distance), ease:"Elastic.easeOut"});
            },

            animate: function (highResTimeStamp) {
                var i,
                    xOffset = this.$('#gofish-wave1').offset().left;
                for(i = 1; i<=4; i++) {
                    var obj = this['waveObj' + i],
                        $wave = obj.$el,
                        yPos = obj.startY + obj.addOn * Math.cos(obj.angle += obj.deltaAngle);

                    $wave.css({top: yPos});
                }
                for(i = 1; i<=8; i++) {
                    var obj = this['distObj' + i],
                        $el = obj.$el,
                        yPos = obj.startY + obj.addOn * Math.cos(obj.angle += obj.deltaAngle),
                        xPos = obj.startX - obj.speed;

                    $el.css({top: yPos, left: xPos});

                    obj.startX = xPos;

                    if (i < 7 && obj.startX < 0) {
                        obj.startX = 1500 + -1*xOffset;
                        this.placeDistractor(obj);
                    }
                }

                this.animationID = requestAnimationFrame(this.animate.bind(this));
            },

            killAnimation: function () {
                cancelAnimationFrame(this.animationID);
            },

            onDestroy: function () {
                this.killAnimation();
            }


        });

    });