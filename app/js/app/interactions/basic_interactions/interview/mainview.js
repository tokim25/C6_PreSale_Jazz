/**
 * Created by jhoffsis on 6/30/16.
 */


/**
 * Created by jhoffsis on 7/19/17.
 */

define(["marionette",
        "app/vent",
        "app/app"],
    function (Marionette, vent, app) {
        return Marionette.ItemView.extend({

            name: 'Interview',

            ui: {
                //
                textbox: '.popup-text-box',
                instrux: '.onscreen-instrux',
                messageContainer: '.slack-message-container',
                slackNode: '.slack-node.template',
                slackTyping: '.slack-typing',
                questionContainer: '.slack-right-body',
                questions: '.slack-right-question',
                continueButton: '.continue-button',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.continueButton': 'onButtonClicked',
                'click @ui.questions': 'onQuestionClicked'
            },

            initialize: function (options) {
                this.template = options.template;
                this.model = options.model;
                var question = this.model.get('question');
                question.name = app.model.getStudentName();
                this.model.set('question', question);
                this.listenTo(this.model, 'model:update', this.onModelUpdate)
                trace('mainview: initialize()');

            },

            onRender: function () {
                trace('mainview: onRender()');

                //setTimeout(function () {
                this.constructInteraction();
                //}.bind(this), 500);

                this.ui.scrim.hide();
                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
                TweenMax.set(this.ui.instrux, {autoAlpha: 0.0});


            },

            startInteraction: function () {
                TweenMax.to(this.ui.instrux, 0.7, {autoAlpha: 1.0});
            },

            onQuestionClicked: function (e) {
                var $item = $(e.currentTarget),
                    index = $item.attr('data-index'),
                    item = this.model.getByIndex(index),
                    answers = [],
                    $q_node, $a_node;

                $item.addClass('disabled');

                $q_node = this.createMessage(this.model.question.image, this.model.question.name, item.question)

                this.ui.messageContainer.append($q_node);
                TweenMax.to(this.ui.messageContainer.parent(), 1.5, {scrollTo: this.ui.messageContainer.parent()[0].scrollHeight});

                for (var i = 0; i<item.answer.length; i++) {
                    answers.push('');
                    answers.push(item.answer[i]);
                }
                this.ui.questionContainer.css('pointerEvents', 'none');
                var interval = setInterval(function () {
                    if (answers.length) {
                        var ans = answers.shift();
                        if (ans == '') {
                            TweenMax.set(this.ui.slackTyping, {'opacity': 1});
                            return;
                        }
                        TweenMax.set(this.ui.slackTyping, {'opacity': 0});
                        if ($a_node == undefined) {
                            $a_node = this.createMessage(this.model.answer.image, this.model.answer.name, ans);
                            this.ui.messageContainer.append($a_node);
                        } else {
                            $a_node.find('.slack-message-body').append('<p>' + ans + '</p>');
                        }
                        TweenMax.to(this.ui.messageContainer.parent(), 1.5, {scrollTo: this.ui.messageContainer.parent()[0].scrollHeight})

                    } else {
                        this.ui.questionContainer.css('pointerEvents', 'all');
                        clearInterval(interval);
                    }
                }.bind(this), 700);


                this.model.updateCompleted();
            },

            createMessage: function (img, name, body) {
                var $node = this.ui.slackNode.clone();

                $node.removeClass('template');
                $node.find('img').attr('src', img);
                $node.find('.slack-message-name').html(name);
                $node.find('.slack-message-body').html('<p>' + body + '</p>');

                return $node;
            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');
                switch (dataID) {
                    case 'continue':
                        this.endInteraction();
                        break;
                }
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

            onModelUpdate: function (complete) {

                this.buttonEnable(this.ui.continueButton, complete);
            },

            endInteraction: function () {
                this.trigger('interaction:complete', this.model);
            },

            constructInteraction: function () {
                this.ui.slackTyping.find('span').html(this.model.answer.name);
                TweenMax.set(this.ui.slackTyping, {'opacity': 0});
                this.buttonEnable(this.ui.continueButton, false);

                this.$('.slack-contact').each(function () {
                    var isInactive = Math.random() < 0.5 ? true : false;
                    if (isInactive && !$(this).hasClass('current') && !$(this).hasClass('slack-left-user')) {
                        $(this).addClass('inactive');
                    }
                })
            }
        });

    });