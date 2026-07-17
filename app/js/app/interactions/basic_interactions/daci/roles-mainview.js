/**
 * Created by jhoffsis on 6/30/16.
 */


/**
 * Created by jhoffsis on 7/19/17.
 */

define(["marionette",
        "app/vent",
        "app/app",
        "app/interactions/basic_interactions/daci/slack-feedback"],
    function (Marionette, vent, app, SlackFeedback) {
        return Marionette.ItemView.extend({

            name: 'DACI ROLES',

            ui: {
                //
                textbox: '.popup-text-box',
                instrux: '.onscreen-instrux',
                slackFeedbackContainer: '.slack-feedback-container',
                rolesContainer: '.daci-roles-container',
                roles: '.daci-role-choice',
                people: '.daci-person',
                tooltip: '.tool-tip',
                buttonContainer: '.button-container',
                checkansButton: '.checkans-button',
                continueButton: '.continue-button',
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
                'click @ui.roles': 'onRoleClicked',
                'click @ui.feedbackButton': 'onButtonClicked',
                'click @ui.scenarioButton': 'onButtonClicked',
                'mouseover @ui.people .daci-person-wrapper': 'onPersonOver',
                'mouseout @ui.people .daci-person-wrapper': 'onPersonOut'
            },

            initialize: function (options) {
                this.template = options.template;
                this.model = options.model;
                this.listenTo(this.model, 'model:init-complete', this.rerender);
                this.listenTo(this.model, 'model:update', this.onModelUpdate);

                this.slackFeedback = new SlackFeedback({model: new Backbone.Model({}), controller: this});
                this.listenTo(this.slackFeedback, 'slackFeedback:complete', this.hideSlackFeedback);

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

            onRoleClicked: function (e) {
                var $role = $(e.currentTarget),
                    role_id = $role.attr('data-id'),
                    $target = $role.parent().parent(),
                    id = $target.attr('data-id'),
                    item = _.find(this.model.people, {'id': id});

                this.model.updateSelected(id, role_id);
                $target.find('.daci-role-choice').removeClass('selected');
                if(item.selectedRole == role_id) {
                    $role.addClass('selected');
                }
            },

            onPersonOver: function (e) {
                var $target = $(e.currentTarget).parent(),
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

                if (this.$currentItem && this.$currentItem == $(e.currentTarget).parent()) {
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

            onModelUpdate: function (complete) {
                if (complete) {
                    this.buttonEnable(this.ui.checkansButton, true);
                } else {
                    this.buttonEnable(this.ui.checkansButton, false);
                }
            },

            checkAnswers: function () {
                var alert = this.model.getAlert();
                if (alert != null) {
                    this.showFeedback(alert);
                    return;
                }
                var results = this.model.getFeedback(),
                    feedback = results.length ? this.model.get('feedback').roles.incorrect : this.model.get('feedback').roles.correct;

                this.numAttempts ++;

                if(this.numAttempts > 3 && results.length) {
                    this.ui.showanswersButton.show();
                }

                this.showFeedback(feedback);

            },

            hideFeedback: function () {
                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
                this.ui.checkansButton.fadeIn();
                this.ui.buttonContainer.fadeIn();
                this.ui.instrux.show();
            },

            showFeedback: function (feedback) {
                 var feedbackObj = {
                     header: '<h2>' + feedback.header + '</h2>',
                     body: '<p>' + feedback.body + '</p>'
                 };
                this.ui.textbox.find('.content').html(feedbackObj.header + feedbackObj.body);
                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});


                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 1.0});
                TweenMax.set(this.ui.rolesContainer, {autoAlpha: 0.0});
                this.ui.checkansButton.hide();
                this.ui.buttonContainer.hide();
                this.ui.instrux.hide();
            },

            onFeedbackDismissed: function () {
                if (this.model.allSelected() && this.model.allCorrect()) {
                    TweenMax.to(this.ui.textbox, 0.5, {
                        autoAlpha: 0.0,
                        onComplete: this.endInteraction,
                        onCompleteScope: this
                    });
                } else if (this.model.getAlert() != null) {
                    this.hideFeedback();
                    this.hideSlackFeedback();
                } else {
                    this.hideFeedback();
                    this.showSlackFeedback();
                }
            },

            showScenario: function () {
                this.showFeedback(this.scenarioMessage);
            },

            showAnswers: function () {
                this.ui.roles.removeClass('selected');
                this.model.clearSelected();
                this.model.selectCorrect();
                _.each(this.model.people, function (person) {
                    //TODO
                    var $person = this.$('[data-id="' + person.id + '"]'),
                        $role = $person.find('[data-id="' + person.selectedRole + '"]');
                    $role.addClass('correct selected');
                }.bind(this));
                this.ui.roles.css('pointerEvents', 'none');
                this.buttonEnable(this.ui.continueButton, true);
                this.ui.scenarioButton.hide();
                this.ui.showanswersButton.hide();
                this.ui.instrux.html(this.model.get('feedback').showRoles);
                this.ui.instrux.show();
                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
                TweenMax.set(this.ui.rolesContainer, {autoAlpha: 1.0});
            },

            showSlackFeedback: function () {
                var results = this.model.getFeedback(),
                    numResults = results.length,
                    otherContacts = [{name: "Carl Castle"}, {name: "Henri Weinhardt"},{name: "Jane Friedham"},{name: "Kurt Weigel"}];

                results = _.shuffle(results.concat(otherContacts));

                var model = new Backbone.Model({
                    user: {name: app.model.getStudentName()},
                    contacts:results,
                    currentContact: {name: 'Some User'},
                    numTotal: numResults
                });
                this.slackFeedback.model = model;

                if(this.ui.slackFeedbackContainer.is(':empty')) {
                    this.ui.slackFeedbackContainer.append(this.slackFeedback.render().el);
                } else {
                    this.slackFeedback.render();
                }
                this.ui.slackFeedbackContainer.show();
                TweenMax.set(this.ui.rolesContainer, {autoAlpha: 0.0});
                this.ui.checkansButton.hide();
                this.ui.scenarioButton.hide();
            },

            hideSlackFeedback: function () {
                TweenMax.to(this.ui.rolesContainer, 0.5, {autoAlpha: 1.0});
                this.ui.slackFeedbackContainer.hide();
                this.ui.checkansButton.show();
                this.ui.scenarioButton.show();
            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');
                switch (dataID) {
                    case 'continue':
                        this.endInteraction();
                        break;
                    case 'checkans':
                        this.checkAnswers();
                        break;
                    case 'ok':
                        this.onFeedbackDismissed();
                        break;
                    case 'feedback':
                        this.showTextbox();
                        break;
                    case 'scenario':
                        this.showScenario();
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
                this.ui.showanswersButton.hide();
                this.buttonEnable(this.ui.continueButton, false);
                this.buttonEnable(this.ui.checkansButton, false);
                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});

            }
        });

    });