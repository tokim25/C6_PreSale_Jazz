

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/dnd_sorting/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext, splashtext, conclusiontext) {

    return Marionette.ItemView.extend({
        template: text,

        ui: {
            feedbackContainer: '.popup-container',
            finalFeedback1: '#resp2-final-feedback1',
            finalFeedback2: '#resp2-final-feedback2',
            finalFeedback: '.resp2-final-feedback',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            submitButton: '.submit-button',
            continueButton: '.continue-button',
            description: '.resp2-role-description',
            nOFn: '.resp2-nOFn',
            draggable: '.resp2-role-sticker',
            droppables: '.resp2-case',
            scrim: '.scrim-background'
        },

        events: {'click .main-button': 'onButtonClicked'},
        $win: null,
        $feedback: null,
        oldClass: '',

        initialize: function (options) {
            this.model = options.model;
            this.listenTo(this.model, 'model:update', this.onModelUpdate)
            trace('mainview: initialize()');
        },

        onRender: function () {
            trace('mainview: onRender()');
            var feedbackObj = {
                'template': popuptext,
                'showTitle': true,
                'title': 'The new and IMPROVED title!',
                'body': '<p></p>',
                'buttons': [{'id': 'ok', 'label': 'Got it!'}],
                'containerClass': 'licenseplate-popup'
            }
            this.feedback = new Popup(feedbackObj);
            this.listenTo(this.feedback, 'ok:clicked', this.onFeedbackDismissed);
            this.ui.feedbackContainer.append(this.feedback.render().el);

            this.$feedback = this.feedback.$el.find('.licenseplate-popup');
            this.$feedback.hide();

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

            this.$win = $(window);
            setTimeout(function () {
                this.constructInteraction();
            }.bind(this), 500);
            this.ui.scrim.hide();
            //this.ui.submitButton.removeClass('enabled').addClass('disabled');
            this.buttonEnable(this.ui.submitButton, false);
            TweenMax.set(this.ui.continueButton, {autoAlpha: 0.0});
            
            TweenMax.set(this.ui.description, {autoAlpha: 0.0});
            TweenMax.set(this.ui.finalFeedback, {autoAlpha: 0.0});
            
            this.splash.show();
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();
            this.updateNumber();
            this.goNext();
            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.$el.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget), id = $button.attr('id'), dataID = $button.attr('data-id');

            switch (dataID) {
                case 'submit':
                    this.checkAnswers();
                    break;
                case 'continue':
                    this.showConclusion();
            }

            vent.trigger('play_sfx', 'button_click');
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

        checkAnswers: function () {
            var textObj, feedbackObj,
                allCorrect = this.model.allCorrect();
            if (allCorrect) {
                textObj = this.model.get('text').feedback.correct;
                feedbackObj = $.extend({}, textObj);
            } else {
                textObj = this.model.get('text').feedback.incorrect;
                feedbackObj = $.extend({}, textObj);
                feedbackObj.body = feedbackObj.body.replace('<numIncorrect>', this.model.numIncorrect());
                feedbackObj.body = feedbackObj.body.replace('<numTotal>', this.model.numTotal());
            }
            this.feedback.setText(feedbackObj);
            this.showFeedback();
        },

        onFeedbackDismissed: function () {
            this.hideFeedback();
            if (this.model.allCorrect()) {
                trace("Interaction is over", 4);
                this.showFinalFeedback();
            } else {
                this.resetIncorrect();
            }
        },

        showFeedback: function () {
            //TweenMax.set(this.$feedback, {scale: 0.5});
            //TweenMax.to(this.$feedback, 0.5, {delay: 0.5, ease: Back.easeOut, top: '50%'})
            this.$feedback.fadeIn();
            this.ui.scrim.fadeIn();

            vent.trigger('play_sfx', 'resp_popup');
        },

        hideFeedback: function () {
            //TweenMax.to(this.$feedback, 0.5, {delay: 0.5, ease: Back.easeOut, top: '150%'})
            this.$feedback.fadeOut();
            this.ui.scrim.fadeOut();
        },


        showFinalFeedback: function () {
            var tl = new TimelineMax();

            TweenMax.set(this.ui.finalFeedback, {autoAlpha: 1.0});

            tl.add(TweenMax.to('.resp2-cases', 0.5, {autoAlpha: 0.0}))
                .add(TweenMax.to('.resp2-line-bg', 0.5, {top: '0%'}))
                .add(TweenMax.from(this.ui.finalFeedback1, 1.0, {scale: 0.7, autoAlpha: 0.0, ease: Back.easeOut}))
                .add(TweenMax.from(this.ui.finalFeedback2, 1.0, {scale: 0.7, autoAlpha: 0.0, ease: Back.easeOut}))
                .add(TweenMax.to(this.ui.continueButton, 1.0, {autoAlpha: 1.0}), '+=.5')

            this.ui.nOFn.hide();

            this.ui.submitButton.fadeOut(function () {
                this.ui.submitButton.html('Continue');
                this.ui.submitButton.fadeIn();
            }.bind(this))

            this.ui.submitButton.fadeOut();
            //this.ui.continueButton.delay(1000).fadeIn();

        },

        hideFinalFeedback: function () {
            this.showConclusion();
        },


        resetIncorrect: function () {
            var as_positions = this.model.roles.get('as').get('positions'),
                cs_positions = this.model.roles.get('cs').get('positions'),
                as_diff, cs_diff;

            as_diff = _.difference(as_positions, this.pos_as);
            cs_diff = _.difference(cs_positions, this.pos_cs);

            this.model.roles.get('as').set('positions', as_diff.concat(this.pos_as));
            this.model.roles.get('cs').set('positions', cs_diff.concat(this.pos_cs));
            this.model.reset();
            this.$('.incorrect').remove();
            //this.ui.submitButton.addClass('disabled').removeClass('enabled');
            this.buttonEnable(this.ui.submitButton, false);
            this.updateNumber();
            this.goNext(2000);
        },

        updateDrop: function ($drop, $drag) {
            var item = $drag.data('item'),
                $sticker = $('<div class="resp2-role-sticker"</div>'),
                roleID = item.get('roleID'),
                dropID = $drop.attr('data-id'),
                isIncorrect = (dropID != roleID),
                $holder = $drop.find('.drag-holder'),
                offsetIndex = $holder.children().length,
                positions = this.model.roles.get(dropID).get('positions'),
                position = positions[offsetIndex],
                bgPos = $drag.css('backgroundPosition'),
                offsetX = 0;

            $holder.append($sticker);
            vent.trigger('play_sfx', 'resp2_drop');
            var random = (3 - Math.round(Math.random()*6)),
                rotation;

            if(dropID == 'as') {
                rotation = (- Math.round(Math.random()*20));
                trace(position, 4);
            } else {
                rotation = (10 - Math.round(Math.random()*20));
                offsetX = 15;
            }

            TweenMax.set($sticker, {
                autoAlpha: 0.7,
                scaleX: 0.18,
                scaleY: 0.22,
                position: 'absolute',
                rotation: rotation + 'deg',
                left: position.x + random + offsetX,
                bottom: position.y + random,
                top: 'auto',
                backgroundPosition: bgPos})

            if (isIncorrect) {
                $sticker.addClass('incorrect');
                this['pos_' + dropID].push(position);
            }

        },

        onDrop: function ($drag, $drop) {
            var item = $drag.data('item'),
                roleID = $drop.attr('data-id');

            this.model.setID(item, roleID);
            this.updateDrop($drop, $drag);

            TweenMax.to(this.ui.description, 0.5, {autoAlpha: 0.0, ease:Linear.easeNone});

            TweenMax.set(this.ui.draggable, {autoAlpha: 0.0});

            this.updateNumber();

            if (!this.model.allComplete()) {
                this.goNext(1000);
            } else {

                //this.ui.submitButton.addClass('enabled').removeClass('disabled');
                this.buttonEnable(this.ui.submitButton, true);
            }
        },

        goNext: function (delay) {
            delay = delay || 100;
            var item = this.model.getNextItem(),
                offset = item.get('id') * -175,
                text = item.get('text');

            this.ui.draggable.data('item', item);
            this.ui.draggable.css({'backgroundPosition': offset + 'px 0px'});

            setTimeout(function () {

                this.ui.description.find('.content').html(text);

                TweenMax.set(this.ui.description, {autoAlpha: 0.0});

                TweenMax.to(this.ui.description, 1.5, {delay: 0.5, autoAlpha: 1.0, ease:Linear.easeOut});
                TweenMax.to(this.ui.draggable, 0.5, {autoAlpha: 1.0});

            }.bind(this), delay);

        },

        updateNumber: function () {
            this.ui.nOFn.html(this.model.numCompleted + ' of ' + this.model.items.length);
        },

        constructInteraction: function () {
            var self = this,
                pos = this.ui.draggable.position();
            this.ui.draggable.data('top', pos.top);
            this.ui.draggable.data('left', pos.left);

            this.ui.draggable.draggable({
                revert: true,
                start: function (event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function (event, ui) {
                    var $this = $(this);
                    $this.removeClass('dragging');
                    TweenMax.set($this, {left: $this.data('left'), top: $this.data('top')});
                }
            }).css("position", "absolute");
            this.ui.droppables.droppable({
                drop: function (e, ui) {
                    var $drag = ui.draggable, $drop = $(this);
                    self.onDrop($drag, $drop);
                },
                tolerance: 'pointer',
                accept: '.resp2-role-sticker',
                hoverClass: 'dragging'
            });

            //this.$feedback.css('margin-top', -this.$feedback.height() / 2 + 'px')

            this.pos_as = [];
            this.pos_cs = [];
            this.feedback.$el.show();
        }
    });
});
