/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/quiz_dnd/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
        return Marionette.ItemView.extend({

            template: text,

            ui: {
                //
                splashContainer: '.splash-container',
                conclusionContainer: '.conclusion-container',
                feedbackContainer: '.quiz_dnd-feedback-box',
                questionBox: '.quiz_dnd-question-box',
                answerBox: '.quiz_dnd-answer-box',
                answerChoice: '.quiz_dnd-answer-choice.enabled',
                needle: '.quiz_dnd-needle',
                gauge: '.quiz_dnd-gauge',
                speechBox: '.quiz_dnd-speechbox',
                microphone: '.quiz_dnd-mic',
                nOFn: '.quiz_dnd-nOFn',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.continueButton': 'onButtonClicked'
            },

            initialize: function (options) {
                this.model = options.model;

                this.listenTo(this.model, 'model:update', this.onModelUpdate);
                this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

                this.currentRotation = 0;
            },

            onRender: function () {
                var textObj = {
                    'template': popuptext,
                    'showTitle': true,
                    'title': '',
                    'body': '',
                    'buttons': [{'id': 'continue', 'label': 'OK!'}],
                    'containerClass': 'blob1-popup'
                }
                this.feedback = new Popup(textObj);
                this.listenTo(this.feedback, 'continue:clicked', this.checkAnswer);

                this.ui.feedbackContainer.append(this.feedback.render().el);

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

                this.ui.scrim.hide();

                this.constructInteraction();

                this.$win = $(document);

                TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});
                TweenMax.set('.quiz_scrolldoc-answer', {autoAlpha: 0.0});
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

            onInteractionComplete: function () {
                this.showConclusion();
            },

            showConclusion: function () {
                this.conclusion.$el.fadeIn();
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
                    $choice;

                this.ui.nOFn.html(this.model.getnOFnString());

                $questionDiv.html(curQuestion.text);

                //this.$('.quiz_dnd-answer-choice').draggable('destroy');
                $answerDiv.empty();

                this.ui.speechBox.find('h2').html('');
                _.each(curQuestion.choices, function (choice, index) {
                    $choice = $proto.clone();
                    $choice.removeClass('proto');
                    $choice.html(choice.text)
                    $choice.data('choice', choice);
                    $choice.data('index', index);
                    $answerDiv.append($choice);
                    TweenMax.set($choice, {autoAlpha: 0.0});
                }.bind(this));

                setTimeout(function () {
                    TweenMax.set(this.ui.questionBox, {rotationX: '-=180deg'});
                    TweenMax.set(this.ui.answerBox, {autoAlpha: 1.0})
                    var tl = new TimelineMax();
                    tl.add(TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '+=180deg', autoAlpha: 1.0}))
                        .add(TweenMax.staggerTo('.quiz_dnd-answer', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));

                    var self = this;

                    this.$('.quiz_dnd-answer-choice').draggable({
                        revert: function(valid)
                        {

                            //if false then no socket object drop occurred.
                            if(valid === false)
                            {
                                self.playSFX('drag_revert');
                                return true;
                            }
                            return false;
                        },
                        revertDuration: 0.3,
                        helper: function () {
                            var $clone = $(this).clone();
                            $clone.addClass('dragging');
                            return $clone;
                        },
                        //cursorAt: {top:95, left: 145},
                        zIndex: 100,
                        start: function (event, ui) {$(this).css('opacity', 0.4);},
                        stop: function (event, ui) {$(this).css('opacity', 1.0);}
                    });

                }.bind(this), 100);



            },

            nextQuestion: function () {
                this.model.nextQuestion(1);
            },


            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');

                vent.trigger('play_sfx', 'button_click');

                // Interaction is complete
            },

            checkAnswer: function () {

                var isCorrect = this.model.isCorrect(),
                    rotation, crowdSFX;

                if (isCorrect) {
                    if(this.currentRotation + 15 <= 90) {
                        this.currentRotation += 15;
                        rotation = '+=15'
                    } else {
                        rotation = '+=' + (90 - this.currentRotation);
                        this.currentRotation = 90;
                    }
                    crowdSFX = 'crowd_cheering';
                } else {
                    if(this.currentRotation - 15 >= -90) {
                        this.currentRotation -= 15;
                        rotation = '-=15'
                    } else {
                        rotation = '-=' + (90 - Math.abs(this.currentRotation));
                        this.currentRotation = -90;
                    }
                    crowdSFX = 'crowd_cheering';
                }


                this.hideFeedback(0);

                var tl = new TimelineMax();
                tl.addLabel('showMeter', '+=0.1')
                    .addCallback(this.playSFX, 'showMeter', ['crowd_meter'], this)
                    .addCallback(this.playSFX, 'showMeter', [crowdSFX], this)
                    .add(TweenMax.to(this.ui.gauge, 0.5, {bottom: '-100px', ease:Back.easeOut}), 'showMeter')

                    .addLabel('doNeedle', '+=0.4')
                    .add(TweenMax.to(this.ui.needle, 0.3, {rotation: rotation, transformOrigin: '175px 173px', ease:Back.easeOut}), 'doNeedle')
                    .addCallback(this.playSFX, 'doNeedle', ['crowd_meter_needle'], this)

                    .addLabel('hideMeter', '+=2.4')
                    .add(TweenMax.to(this.ui.gauge, 0.5, {bottom: '-450px'}), 'hideMeter')
                    .addCallback(this.playSFX, 'hideMeter', ['crowd_meter_hide'], this);


                if(isCorrect) {
                    tl.add(TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0}))
                        .add(TweenMax.staggerTo('.quiz_dnd-answer', 0.5, {autoAlpha: 0.0}, 0.2))
                        .addCallback(this.nextQuestion, '+=0.5', [], this);

                } else {
                    tl.add(TweenMax.to(this.ui.answerBox, 0.2, {autoAlpha: 1.0}))
                        .addCallback(function () {this.ui.speechBox.find('h2').html(''); trace('INCORRECT CALLBACK', 4);}, 0, [], this);

                    this.$selectedChoice.addClass('disabled').removeClass('enabled selected dragging').draggable( "disable" );
                }



            },

            playSFX: function (sfx) {
                vent.trigger('play_sfx', sfx);
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
                TweenMax.to(this.ui.answerBox, 0.5, {delay:delay, autoAlpha: 0.0});

                setTimeout(function () {
                    vent.trigger('play_sfx', 'popup');
                }.bind(this), delay*1000);



                this.ui.scrim.fadeIn(300);
            },

            hideFeedback: function (delay) {

                delay = delay || 0;

                var $popup = this.feedback.$el.find('.popup-view');

                $popup.removeClass('correct');
                TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 0.0, ease: Power3.easeOut})

                this.ui.scrim.fadeOut(300);
            },

            doDrop: function ($choice) {

                var choice = $choice.data('choice'),
                    index = $choice.data('index'),
                    feedbackObj = {
                        header: choice.feedback.title,
                        body: '<p>' + choice.feedback.body + '</p>'
                    };

                $choice.addClass('selected').removeClass('enabled');

                this.ui.speechBox.find('h2').html(choice.text);

                this.$selectedChoice = $choice;

                this.model.updateChoice(index);

                this.showFeedback(feedbackObj, 1.2);

                vent.trigger('play_sfx', 'drag_drop');

            },

            constructInteraction: function () {
                var self = this;

                this.ui.speechBox.droppable({
                    drop: function (e, ui) {
                        var $drag = ui.draggable
                        self.doDrop($drag);
                    },
                    tolerance: 'intersect',
                    hoverClass: 'active',
                    accept: '.quiz_dnd-answer-choice'
                });
            },

            onDestroy: function () {
            }


        });

    });