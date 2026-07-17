/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
    "app/vent"],
  function (Marionette, vent) {
    return Marionette.ItemView.extend({

      name: 'Multiple Choice',

      ui: {
        //
        textbox: '.popup-text-box',
        scenarioContainer: '.scenario-container',
        scenarioImage: '.mc-scenario-image',
        scenarioLabel: '.mc-scenario-label',
        scenarioText: '.mc-scenario-text',
        qaContainer: '.qa-container',
        questionBox: '.question-box',
        answerBox: '.answer-box',
        answerChoice: '.answer-choice.enabled',
        continueButton: '.continue-button',
        submitButton: '.submit-button',
        okButton: '.ok-button',
        scrim: '.scrim-background'
      },

      events: {
        'click @ui.continueButton': 'onButtonClicked',
        'click @ui.submitButton': 'onButtonClicked',
        'click @ui.okButton': 'onButtonClicked',
        'click @ui.answerChoice.enabled:not(.sequence)': 'onChoiceClicked'
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
        this.buttonEnable(this.ui.submitButton, false);
        this.ui.submitButton.hide();

      },

      startInteraction: function () {

        this.model.reinitialize();

        this.model.nextQuestion(1);

        this.trigger('mainview:activity-start');

      },

      onModelUpdate: function () {
        var curQuestion = this.model.curQuestion,
          type = curQuestion.type,
          label = curQuestion.label,
          scenario = curQuestion.scenario,
          $questionDiv = this.ui.questionBox,
          $answerDiv = this.ui.answerBox.find('.content'),
          $proto = this.$('.proto'),
          $choice,
          self = this;

        $answerDiv.addClass(type);

        this.tl_enter = new TimelineMax();

        $answerDiv.empty();

        _.each(curQuestion.choices, function (choice, index) {
          $choice = $proto.clone();
          $choice.removeClass('proto').addClass(type);
          $choice.append('<p>' + choice.text + '</p>')
          $choice.data('choice', choice);
          $choice.data('index', choice.index != undefined ? choice.index : index);
          $answerDiv.append($choice);
          TweenMax.set($choice, {autoAlpha: 0.0});
        }.bind(this));

        $questionDiv.html(curQuestion.text);

        if (label != undefined && label != '') {
          this.ui.scenarioLabel.html(label);
        }

        if (scenario != undefined && scenario != '') {
          if (scenario.label != undefined) {
              this.ui.scenarioText.html(scenario.label);
          }
          if (scenario.imageID != undefined) {
              var src = this.model.assetForID(scenario.imageID).src;
              this.ui.scenarioImage.attr('src', src);
          }
          this.ui.scenarioText.html(scenario);
        }

        this.numWrong = 0;

        setTimeout(function () {

          this.tl_enter.add(TweenMax.to(this.ui.scenarioContainer, 0.3, {autoAlpha: 1.0}))
            .add(TweenMax.staggerFrom(this.ui.scenarioLabel.find('p'), 0.3, {autoAlpha: 0.0, marginLeft: '50px'}, 0.3))
            .add(TweenMax.to(this.ui.scenarioImage, 0.3, {autoAlpha: 1.0}, 0.3))
            .add(TweenMax.to(this.ui.questionBox, 0.3, {autoAlpha: 1.0}), '+=.3')
            .add(TweenMax.staggerTo('.answer-choice', 1.0, {delay: 0.3, autoAlpha: 1.0}, 0.2));

        }.bind(this), 10);

        if (type === 'sa' || type === 'sequence') {
          this.ui.submitButton.show();
        }

        if (this.model.curQuestion.type === 'sequence') {
          this.$('.content.sequence').sortable({
            stop: function () {

              var sortedIDs = [];
              self.$('.answer-choice.sequence').each(function(){
                sortedIDs.push($(this).data('index'));
              });
              self.model.sortedIDs = sortedIDs;
              if (self.ui.submitButton.hasClass('disabled')) {
                self.buttonEnable(self.ui.submitButton, true);
              }
            }
          });
        } else if ($answerDiv.hasClass('ui-sortable')) {
          $( ".content.sequence" ).sortable( "destroy" );
        }


      },

      nextQuestion: function () {
        this.model.nextQuestion(1);
      },

      onChoiceClicked: function (e) {
        var $choice = $(e.currentTarget),
          choice = $choice.data('choice'),
          index = $choice.data('index'),
          feedbackObj;

        if (this.model.curQuestion.type === 'sa') {
          $choice.toggleClass('selected');
          var value = $choice.hasClass('selected');
          this.model.updateChoices(choice, value);
          if (this.model.curChoices.length && this.ui.submitButton.hasClass('disabled')) {
            this.buttonEnable(this.ui.submitButton, true);
          } else if (!this.model.curChoices.length) {
            this.buttonEnable(this.ui.submitButton, false);
          }
        } else {

          $choice.addClass('selected').removeClass('enabled');
          this.model.updateChoice(index);
          this.$selectedChoice = $choice;
          feedbackObj = {
            header: '<h2>' + choice.feedback.title + '</h2>',
            body: '<p>' + choice.feedback.body + '</p>'
          };
          this.showFeedback(feedbackObj, 0.35);
        }

        vent.trigger('play_sfx', 'answer_click');

      },


      doSubmit: function () {
        var feedback = this.model.curQuestion.feedback,
          result = this.model.isCorrect() ? 'correct' : 'incorrect',
          feedbackObj = {
            header: '<h2>' + feedback[result].title + '</h2>',
            body: '<p>' + feedback[result].body + '</p>'
          };
        this.showFeedback(feedbackObj, 0.35);

        if (this.model.curQuestion.type === 'sa' || this.model.curQuestion.type === 'sequence') {
          this.buttonEnable(this.ui.submitButton, false);
        }
      },

      checkAnswer: function () {

        this.hideFeedback(0);

        if (this.model.isCorrect()) {
          this.tl_leave = new TimelineMax({})
          this.tl_leave.add(TweenMax.to(this.ui.scenarioContainer, 0.3, {autoAlpha: 0.0}))
            .add(TweenMax.to(this.ui.questionBox, 0.5, {autoAlpha: 0.0}), '-=0.3')
            .addCallback(this.nextQuestion, '+=.2', [], this);
          this.ui.answerBox.delay(2000).slideDown();
        } else {
          if (this.model.curQuestion.type === 'sa') {
            this.$('.answer-choice').removeClass('selected');
            this.model.curChoices = [];
          } else if (this.model.curQuestion.type != 'sequence') {
            this.$selectedChoice.addClass('disabled').removeClass('enabled selected');
          }
          var transition = this.model.get('transition');
          switch (transition) {
            case undefined:
            case "slide":
              this.ui.answerBox.slideDown();
              break;
            case "fade":
              this.ui.answerBox.fadeIn();
              break;
            default:
              this.ui.answerBox.slideDown();
          }

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

        var transition = this.model.get('transition');
        switch (transition) {
          case undefined:
          case "slide":
            this.ui.answerBox.slideUp();
            break;
          case "fade":
            this.ui.answerBox.fadeOut();
            break;
          default:
            this.ui.answerBox.slideUp();
        }


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
          case 'submit':
            this.doSubmit();
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