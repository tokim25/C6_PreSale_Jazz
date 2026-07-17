define(["marionette",
    "app/vent"],
  function (Marionette, vent) {
    return Marionette.ItemView.extend({

      name: 'Scenario Multiple Choice',

      ui: {
        //
        textbox: '.popup-text-box',
        scenarioContainer: '.scenario-container',
        scenarioLabel: '.mc-scenario-label',
        scenarioImage: '.mc-scenario-image',
        qaContainer: '.qa-container',
        questionBox: '.question-box',
        answerBox: '.answer-box',
        answerChoice: '.answer-choice.enabled',
        continueButton: '.continue-button',
        okButton: '.ok-button',
        scrim: '.scrim-background'
      },

      events: {
        'click @ui.continueButton': 'onButtonClicked',
        'click @ui.okButton': 'onButtonClicked',
        'click @ui.answerChoice.enabled': 'onChoiceClicked'
      },

      initialize: function (options) {
        this.template = options.template;
        this.model = options.model;
        this.soundPlayer = options.soundPlayer;

        this.listenTo(this.model, 'model:update', this.onModelUpdate);
        this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

      },

      onRender: function () {

        this.ui.scrim.hide();

        this.constructInteraction();

        this.$win = $(document);

        TweenMax.set(this.ui.questionBox, {autoAlpha: 0.0});
        TweenMax.set('.answer-choice', {autoAlpha: 0.0});
        TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
        TweenMax.set(this.ui.scenarioContainer, {autoAlpha: 0.0});

        this.buttonEnable(this.ui.continueButton, false);

      },

      startInteraction: function () {

        this.model.reinitialize();

        this.model.nextQuestion(1);

        this.trigger('mainview:activity-start');

      },

      onModelUpdate: function () {
        this.tl_enter = new TimelineMax();
        //this.tl_enter.fromTo(this.ui.scenarioBox.find('.content'), 0.5, {scale: 0.4, transformOrigin: '50% 50%'}, {scale: 1, transformOrigin: '50% 50%',autoAlpha: 1.0, ease:Back.easeOut});

        var curQuestion = this.model.curQuestion,
          $questionDiv = this.ui.questionBox,
          $answerDiv = this.ui.answerBox.find('.content'),
          $proto = this.$('.proto'),
          $choice;

        this.tl_enter = new TimelineMax();
        //this.tl_enter.fromTo(this.ui.scenarioBox.find('.content'), 0.5, {scale: 0.4, transformOrigin: '50% 50%'}, {scale: 1, transformOrigin: '50% 50%',autoAlpha: 1.0, ease:Back.easeOut});

        $answerDiv.empty();


        $answerDiv.empty();

        _.each(curQuestion.choices, function (choice, index) {
          $choice = $proto.clone();
          $choice.removeClass('proto');
          $choice.html('<p>' + choice.text + '</p>')
          $choice.data('choice', choice);
          $choice.data('index', index);
          $answerDiv.append($choice);
          TweenMax.set($choice, {autoAlpha: 0.0});
        }.bind(this));

        $questionDiv.html(curQuestion.text);

        if (curQuestion.imageID != undefined && curQuestion.imageID != '') {
          var src = this.model.assetForID(curQuestion.imageID).src;
          this.ui.scenarioImage.attr('src', src);
        }

        if (curQuestion.label != undefined) {
          this.ui.scenarioLabel.html(curQuestion.label);
        }


        this.numWrong = 0;

        setTimeout(function () {

          this.tl_enter.add(TweenMax.to(this.ui.scenarioContainer, 0.3, {autoAlpha: 1.0}))
            .add(TweenMax.from(this.ui.scenarioImage, 0.5, {autoAlpha: 0.0}))
            .add(TweenMax.staggerFrom(this.ui.scenarioLabel.find('p'), 0.3, {autoAlpha: 0.0, marginLeft: '50px'}, 0.3))
            .add(TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 1.0}), '+=.5')
            .add(TweenMax.staggerTo('.answer-choice', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.4));

        }.bind(this), 10);


      },

      nextQuestion: function () {
        this.model.nextQuestion(1);
      },

      onChoiceClicked: function (e) {
        var $choice = $(e.currentTarget),
          choice = $choice.data('choice'),
          index = $choice.data('index'),
          feedbackObj = {
            header: '<h2>' + choice.feedback.title + '</h2>',
            body: '<p>' + choice.feedback.body + '</p>'
          };

        $choice.addClass('selected').removeClass('enabled');

        this.$selectedChoice = $choice;

        this.model.updateChoice(index);

        this.showFeedback(feedbackObj, 0.35);

        vent.trigger('play_sfx', 'answer_click');

      },

      checkAnswer: function () {

        this.hideFeedback(0);

        if (this.model.isCorrect()) {
          var index = this.model.curIndex;

          this.tl_leave = new TimelineMax({})
          this.tl_leave.add(TweenMax.to(this.ui.scenarioContainer, 0.3, {autoAlpha: 0.0}))
            .add(TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0}), '-=0.3')
            .addCallback(this.nextQuestion, '+=.2', [], this);
          this.ui.answerBox.delay(2000).slideDown();
        } else {
          this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
          this.ui.answerBox.slideDown();
        }
      },

      playLoop: function (audioID) {
        this.soundPlayer.playLoop(audioID);
      },

      showFeedback: function (content, delay) {
        delay = delay || 0;

        this.ui.textbox.find('.content').html(content.header + content.body);

        var correct = this.model.isCorrect();

        if (correct) {
          this.ui.textbox.addClass('correct');
        } else {
          this.ui.textbox.removeClass('correct');
        }

        this.ui.answerBox.slideUp();

        TweenMax.set(this.ui.textbox, {scale: 0.5})
        TweenMax.to(this.ui.textbox, 0.5, {delay: delay, autoAlpha: 1.0, scale: 1.0, ease: Back.easeOut});

        setTimeout(function () {
          vent.trigger('play_sfx', 'popup');
        }.bind(this), delay * 1000);

        //TODO: size the scrim to $win dimensions, or include onresize method
        this.ui.scrim.fadeIn(300);
      },

      hideFeedback: function (delay) {

        delay = delay || 0;


        this.ui.textbox.removeClass('correct');
        TweenMax.to(this.ui.textbox, 0.5, {delay: delay, scale: 0.9, autoAlpha: 0.0, ease: Power3.easeOut})

        this.ui.scrim.fadeOut(300);
      },

      onInteractionComplete: function () {
        //this.showConclusion();
        if (this.model.autoEnd()) {
          this.endInteraction();
          return;
        }
        this.ui.qaContainer.fadeOut();
        this.buttonEnable(this.ui.continueButton, true);

      },

      buttonEnable: function ($button, enable) {
        if (enable) {
          $button.addClass('enabled button-reveal').removeClass('disabled');
          setTimeout(function () {
            $button.removeClass('button-reveal');
          }.bind(this), 1600)
        } else {
          $button.removeClass('enabled').addClass('disabled');
        }
      },

      onButtonClicked: function (e) {
        var $button = $(e.currentTarget),
          id = $button.attr('id'),
          dataID = $button.attr('data-id');

        switch (dataID) {
          case 'continue':
            this.endInteraction();
            break;
          case 'ok':
            this.checkAnswer();
            break;
        }
      },

      endInteraction: function () {
        this.trigger('interaction:complete', this.model);
      },

      constructInteraction: function () {

      },

      onDestroy: function () {
        if (this.tl_leave) {
          this.tl_leave.kill();
        }
        if (this.tl_enter) {
          this.tl_enter.kill();
        }

      }


    });

  });