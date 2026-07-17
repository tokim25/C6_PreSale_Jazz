/**
 * Created by jhoffsis on 6/30/16.
 */


/**
 * Created by jhoffsis on 7/19/17.
 */

define(["marionette",
        "app/vent"],
    function (Marionette, vent) {
        return Marionette.ItemView.extend({

            name: 'DACI Team',

            ui: {
                //
                textbox: '.popup-text-box',
                instrux: '.onscreen-instrux',
                teamContainer: '.daci-team-container',
                people: '.daci-person',
                tooltip: '.tool-tip',
                buttonContainer: '.button-container',
                checkansButton: '.checkans-button',
                continueButton: '.continue-button',
                dialogContainer: '.dialog-container',
                showanswersButton: '.showanswers-button',
                okButton: '.ok-button',
                feedbackButton: '.feedback-button',
                scenarioButton: '.scenario-button',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.continueButton': 'onButtonClicked',
                'click @ui.okButton': 'onButtonClicked',
                'click @ui.showanswersButton': 'onButtonClicked',
                'click @ui.checkansButton': 'onButtonClicked',
                'click @ui.feedbackButton': 'onButtonClicked',
                'click @ui.scenarioButton': 'onButtonClicked',
                'click @ui.people': 'onPersonClicked',
                'mouseover @ui.people': 'onPersonOver',
                'mouseout @ui.people': 'onPersonOut'
            },

            initialize: function (options) {
                this.template = options.template;
                this.model = options.model;
                this.listenTo(this.model, 'model:init-complete', this.rerender);
                this.listenTo(this.model, 'model:update', this.onModelUpdate);
                trace('mainview: initialize()');

            },

            onRender: function () {
                trace('mainview: onRender()');

                this.constructInteraction();

                this.ui.scrim.hide();
                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
                TweenMax.set(this.ui.instrux, {autoAlpha: 0.0});
            },

            rerender: function () {
                this.render();
                this.startInteraction();
            },

            startInteraction: function () {
                TweenMax.to(this.ui.instrux, 0.7, {autoAlpha: 1.0});
            },

            onPersonClicked: function (e) {
                var $target = $(e.currentTarget),
                    id = $target.attr('data-id'),
                    item = _.find(this.model.people, {'id': id});

                this.model.updateSelected(id);
                if(item.selected) {
                    $target.addClass('selected');
                } else {
                    $target.removeClass('selected');
                }
            },

            onPersonOver: function (e) {
                var $target = $(e.currentTarget),
                    id = $target.attr('data-id'),
                    item = _.find(this.model.people, {'id': id}),
                    $hover = this.ui.tooltip,
                    role = item.role,
                    pos = $target.offset();

                    this.$currentItem = $target;
                    this.currentItem = item;
                    TweenMax.killTweensOf(this.ui.tooltip);
                    TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
                    $hover.html(role);
                    TweenMax.set($hover, {autoAlpha: 1});
                    $hover.css({
                        left: pos.left + $target.width()/2 - $hover.width()/2 - this.$el.offset().left + 'px',
                        top: pos.top - ($hover.height()+30) + 'px'
                    });
                    TweenMax.set($hover, {autoAlpha: 0});
                    //enter

                    TweenMax.to($hover, 0.3, {delay: 0.1, autoAlpha:1.0});


            },
            onPersonOut: function (e) {
                var $hover = this.ui.tooltip;

                if (this.$currentItem && this.$currentItem == $(e.currentTarget)) {
                    return;
                }

                if ($hover.length) {
                    //leave
                    TweenMax.killTweensOf(this.ui.tooltip);
                    if (this.$currentItem) {
                        TweenMax.to(this.ui.tooltip, 0.3, {autoAlpha: 0.0, onComplete: function () {this.$currentItem = null;}.bind(this)});
                    } else {
                        TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
                    }
                }

            },

            checkAnswers: function () {
                var results = this.model.getFeedback().slice(0, 5),
                    feedback = results.length ? this.model.get('feedback').team.incorrect : this.model.get('feedback').team.correct,
                    feedbackObj = {
                        header: '<h2>' + feedback.header + '</h2>',
                        body: '<p>' + feedback.body + '</p>'
                    };

                if (results.length) {
                    _.each(results, function (result) {
                        var p = '<p>' + result + '</p>';
                        feedbackObj.body += p;
                    })
                }
                
                this.feedbackObj = feedbackObj;

                this.numAttempts ++;

                if(this.numAttempts > 3 && results.length) {
                    this.ui.showanswersButton.show();
                }

                this.showTextbox();

            },

            onFeedbackDismissed: function () {

                if (this.model.allCorrect()) {
                    TweenMax.to(this.ui.textbox, 0.5, {
                        autoAlpha: 0.0,
                        onComplete: this.endInteraction,
                        onCompleteScope: this
                    });
                } else {
                    if(this.numAttempts > 0 && !this.ui.feedbackButton.is(':visible')) {
                        this.ui.feedbackButton.fadeIn();
                    }
                    this.hideTextbox();
                }

            },

            hideTextbox: function () {
                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
                TweenMax.set(this.ui.teamContainer, {autoAlpha: 1.0});
                this.ui.checkansButton.fadeIn();
                this.ui.buttonContainer.fadeIn();
                this.ui.instrux.show();
            },

            showTextbox: function (content) {
               content = content || this.feedbackObj;
                this.ui.textbox.find('.content').html(content.header + content.body);
                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});


                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 1.0});
                TweenMax.set(this.ui.teamContainer, {autoAlpha: 0.0});
                this.ui.buttonContainer.hide();
                this.ui.checkansButton.hide();
                this.ui.instrux.hide();
            },

            showScenario: function () {
                this.showTextbox(this.scenarioMessage);
            },


            showAnswers: function () {
                this.ui.people.removeClass('selected');
                this.model.clearSelected();
                var members = _.filter(this.model.people, {member: true});
                _.each(members, function (member) {
                    var $person = this.$('[data-id="' + member.id + '"]');
                    $person.addClass('correct selected');
                    this.model.updateSelected(member.id);
                }.bind(this));

                this.buttonEnable(this.ui.continueButton, true);
                this.ui.scenarioButton.hide();
                this.ui.showanswersButton.hide();
                this.ui.feedbackButton.hide();
                this.ui.instrux.html(this.model.get('feedback').showAnswers);
                this.ui.instrux.show();
                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
                TweenMax.set(this.ui.teamContainer, {autoAlpha: 1.0});
            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');
                switch (dataID) {
                    case 'continue':
                        this.checkAnswers();
                        //this.endInteraction();
                        break;
                    case 'checkans':
                        this.checkAnswers();
                        break;
                    case 'feedback':
                        this.showTextbox();
                        break;
                    case 'scenario':
                        this.showScenario();
                        break;
                    case 'ok':
                        this.onFeedbackDismissed();
                        break;
                    case 'showanswers':
                        this.showAnswers();
                        break;
                }

                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
            },

            buttonEnable: function ($button, enable) {
                if(enable) {
                    $button.addClass('enabled button-reveal').removeClass('disabled');
                    setTimeout(function () {
                        $button.removeClass('button-reveal');
                    }.bind(this), 1600)
                } else {
                    $button.removeClass('enabled').addClass('disabled');
                }
            },

            endInteraction: function () {
                this.trigger('interaction:complete', this.model);
            },

            constructInteraction: function () {
                var self = this;
                this.numAttempts = 0;
                this.scenarioMessage = this.model.get('scenario') || null;
                this.ui.scrim.hide();
                this.ui.feedbackButton.hide();
                this.ui.showanswersButton.hide();

                this.buttonEnable(this.ui.continueButton, false);
                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});

            }
        });

    });