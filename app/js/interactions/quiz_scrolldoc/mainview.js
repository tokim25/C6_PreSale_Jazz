/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
        "ui/splash",
    "text!templates/interactions/quiz_scrolldoc/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
        return Marionette.ItemView.extend({

            template: text,

            ui: {
                //
                splashContainer: '.splash-container',
                conclusionContainer: '.conclusion-container',
                feedbackContainer: '.quiz_scrolldoc-feedback-box',
                questionBox: '.quiz_scrolldoc-question-box',
                answerBox: '.quiz_scrolldoc-answer-box',
                answerChoice: '.quiz_scrolldoc-answer-choice.enabled',
                submitButton: '.quiz_scrolldoc-submit-button',
                zoomBox: '.spreadsheet-zoom-container',
                zoomControl: '.spreadsheet-zoom-control',
                zoomButton: '.zoom-button',
                zoomPercent: '.zoom-percent',
                spreadsheetContainer: '.spreadsheet-container',
                spreadsheetFixed: '.spreadsheet-fixed-bg',
                spreadsheetScrolling: '.spreadsheet-scrolling-bg',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.continueButton': 'onButtonClicked',
                'click @ui.zoomButton': 'onZoomButtonClicked',
                'click @ui.answerChoice.enabled': 'onChoiceClicked',
                'click @ui.submitButton': 'onSubmitClicked',
                'keypress .ratecard-answer-fill-in.enabled': 'onInputSelected'
            },

            initialize: function (options) {
                this.model = options.model;

                this.listenTo(this.model, 'model:update', this.onModelUpdate);
                this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

                this.minZoom = 25;
                this.maxZoom = 100;
                this.startZoom = 50;

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
                    type = curQuestion.type,
                    protoClass = 'proto-' + type,
                    $proto = this.$('.' + protoClass),
                    srcFixed = this.model.getSrcByID(curQuestion.image.fixed),
                    srcScrolling = this.model.getSrcByID(curQuestion.image.scrolling),
                    $choice, $submit, letters = ["A:", "B:", "C:", "D:"];

                $questionDiv.html(curQuestion.text);

                this.numTries = 0;

                this.ui.spreadsheetFixed.attr('src', srcFixed);
                this.ui.spreadsheetScrolling.attr('src', srcScrolling);

                $answerDiv.empty();

                if (type === 'choice') {
                    _.each(curQuestion.choices, function (choice, index) {
                        $choice = $proto.clone();
                        $choice.removeClass(protoClass).addClass('enabled');
                        $choice.html('<span class="quiz_scrolldoc-answer-letter">' + letters[index] +'</span><p>' + choice.text + '</p>')
                        $choice.data('choice', choice);
                        $choice.data('index', index);
                        $answerDiv.append($choice);
                        TweenMax.set($choice, {autoAlpha: 0.0});
                    }.bind(this));
                } else if (type === 'fill-in') {
                    $choice = $proto.clone();
                    $choice.removeClass(protoClass).addClass('enabled');
                    TweenMax.set($choice, {autoAlpha: 0.0});
                    $submit = this.ui.submitButton.clone();
                    $submit.removeClass('proto-submit').addClass('enabled');
                    $answerDiv.append($choice);
                    $answerDiv.append($submit);
                    TweenMax.from($submit, 0.5, {delay: 0.5, autoAlpha: 0.0});
                    setTimeout(function () {$choice.focus();}, 500);
                }

                // set custom zoom level
                if (curQuestion.zoomlevel != undefined) {
                    this.startZoom = curQuestion.zoomlevel;
                } else if (this.model.get('zoomlevel') != undefined) {
                    this.startZoom = this.model.get('zoomlevel');
                } else {
                    this.startZoom = 50;
                }

                TweenMax.set(this.ui.questionBox, {rotationX: '-180deg'});

                setTimeout(function () {
                    TweenMax.set(this.ui.questionBox, {autoAlpha: 1.0});
                    var heightOffset = this.ui.questionBox.find('.content').height() + this.ui.questionBox.position().top,
                        maxHeight = 0;
                    TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});

                    // Ensure all the answer choices are of the same height
                    TweenMax.set(this.ui.answerChoice, {autoAlpha: 1.0});
                    this.$('.quiz_scrolldoc-answer.enabled').each(function () {
                        maxHeight = Math.max(maxHeight, $(this).height());
                    });

                    this.$('.quiz_scrolldoc-answer.enabled').height(maxHeight);

                    TweenMax.set(this.ui.answerChoice, {autoAlpha: 0.0});


                    this.ui.answerBox.css('top', heightOffset + 25 + 'px');


                    var tl = new TimelineMax();
                    tl.add(TweenMax.to(this.ui.questionBox, 0.5, {rotationX: '0deg', autoAlpha: 1.0}))
                        .add(TweenMax.staggerTo('.quiz_scrolldoc-answer', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));

                    var yPos = this.ui.spreadsheetFixed.height(),
                        $highlights = this.ui.spreadsheetScrolling.parent().find('.spreadsheet-highlights'),
                        highlightsY = $highlights.position().top;

                    //this.ui.spreadsheetScrolling.parent().css('top', yPos);
                    this.ui.spreadsheetScrolling.css('top', yPos);
                    $highlights.css('top', highlightsY + yPos);

                    this.resetZoom();
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

                this.showFeedback(feedbackObj, 0.2);

                vent.trigger('play_sfx', 'answer_click');

                //TODO: remove the following. Leaving in for now because moved this funcitonality into feedback continue button

            },

            onSubmitClicked: function (e) {
                  var $choice = this.$('.quiz_scrolldoc-answer-fill-in.enabled');
                this.processInput($choice);
            },

            onInputSelected: function (e) {

                if (e.keyCode == 13) {
                    var $choice = $(e.currentTarget);
                    this.processInput($choice);
                }
            },

            processInput: function ($choice) {
                var value = $choice.val(),
                    curQuestion = this.model.curQuestion, curChoice,
                    feedbackObj = {};

                vent.trigger('play_sfx', 'answer_click');
                if (value === '') {
                    return;
                }


                curChoice = this.model.curQuestion;
                this.numTries ++;
                if(this.numTries>3) {
                    value = curChoice.pattern;
                    $choice.val(value);
                    value = value.toLowerCase();
                }
                this.model.updateInput(value);

                feedbackObj = {
                    header: curQuestion.feedback[curChoice.result].title,
                    body: '<p>' + curQuestion.feedback[curChoice.result].body + '</p>'
                };



                this.showFeedback(feedbackObj, 0.2);
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
                    TweenMax.to(this.$('.quiz_scrolldoc-submit-button.enabled'), 0.5, {autoAlpha: 0.0});
                    TweenMax.staggerTo('.quiz_scrolldoc-answer', 0.5, {autoAlpha: 0.0}, 0.2);
                    setTimeout(function () {
                        this.nextQuestion();
                    }.bind(this), 1500);;

                } else if (this.model.curQuestion.type === 'choice') {
                    this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
                } else {
                    var $input = this.$('.quiz_scrolldoc-answer-fill-in.enabled').not('.proto-fill-in');
                    $input.val('').focus();
                }

            },

            resetZoom: function () {
                this.ui.zoomControl.slider( 'value', this.startZoom);
                this.setZoom(this.startZoom / 100, 0);
            },

            setZoom: function (zoom, duration) {
                this.currentZoom = zoom;
                TweenMax.to(this.ui.zoomBox.children(), duration, {scale: zoom, transformOrigin:"left top"});
                var yPos = this.ui.spreadsheetFixed.height() * zoom,
                    scrollHeight = (this.ui.spreadsheetContainer.height()) / zoom;
                //TweenMax.to(this.ui.spreadsheetScrolling.parent(), duration, {'top': yPos, 'height': scrollHeight});
                TweenMax.to(this.ui.spreadsheetScrolling.parent(), duration, {'top': 0, 'height': scrollHeight});

                this.ui.zoomPercent.html(Math.round(this.currentZoom * 100) + '%')
            },

            onZoomButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    zoom = 0.05;

                if ($button.hasClass('out')) {
                    zoom = -0.05;
                }

                this.currentZoom += zoom;

                if (this.currentZoom * 100 > this.maxZoom) {
                    this.currentZoom = this.maxZoom / 100;
                }

                if (this.currentZoom * 100 < this.minZoom) {
                    this.currentZoom = this.minZoom / 100;
                }


                this.setZoom(this.currentZoom, 0.3);
                this.ui.zoomControl.slider( 'value', this.currentZoom * 100);

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
                this.showConclusion();
            },

            constructInteraction: function () {
                var self = this;

                this.ui.zoomControl.slider({
                    min: self.minZoom,
                    max: self.maxZoom,
                    value: self.currentZoom,
                    animate: true,
                    distance: 1,
                    slide: function (e, ui) {
                        var value = ui.value / 100;
                        self.setZoom(value, 0);
                    },
                    stop: function (e, ui) {
                        var value = ui.value / 100;
                        self.setZoom(value, 0.3);
                    }
                });

                setTimeout(function () {
                    var $div = $('<div class="quiz_scrolldoc-zoom-handle"></div>');
                    this.$('.ui-slider-handle').append($div);
                }.bind(this), 200);
            },

            onDestroy: function () {
            }


        });

    });