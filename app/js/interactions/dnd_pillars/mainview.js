/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/dnd_pillars/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            feedbackContainer: '.feedback-container',
            submitButton: '.submit-button',
            questionContainer: '.dnd_pillars-question-container',
            counterEverywhere: '#adholder-everywhere .ad-counter',
            counterPlatform: '#adholder-platform .ad-counter',
            droppables: '.dnd_pillars-ad-slot',
            scrim: '.scrim-background'
        },

        events : {
            'click @ui.submitButton': 'onButtonClicked'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            this.listenTo(this.model, 'model:update', this.onModelUpdate);
            this.listenTo(this.model, 'model:complete', this.onInteractionComplete);

        },

        onRender: function() {
            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'continue', 'label': 'OK!'}],
                'containerClass': 'blob1-popup'
            }
            this.feedback = new Popup(textObj);
            this.listenTo(this.feedback, 'continue:clicked', this.onFeedbackDismissed);

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


            this.constructInteraction();

            TweenMax.set(this.feedback.$el.find('.popup-view'), {autoAlpha: 0.0});
            this.ui.scrim.hide();

            this.buttonEnable(this.ui.submitButton, false);

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();
            this.feedback.$el.show();
            this.model.nextQuestion(1);
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
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            switch (dataID) {
                case 'submit':
                    this.checkAnswers();
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

        onModelUpdate: function (complete) {

            var curQuestion = this.model.curQuestion,
                slots = curQuestion.slots,
                $slotContainer = this.$('.dnd_pillars-ad-slots'),
                i, $draggable, $adholder,
                self = this;

            //destroy any existing draggables
            this.$('audo2-ad').draggable('destroy');

            //clear droppables of labels and dragged items
            this.$('.dnd_pillars-ad-slot').each(function (index, drop) {
                var $drop = $(drop),
                    $drag = $drop.find('.dnd_pillars-ad');

                if($drag.length) {
                    $drag.remove();
                }

                $drop.find('.dnd_pillars-ad-slot-label').html('');
                $drop.data('data-id', '');
                $drop.remove();
            }.bind(this));

            _.each(slots, function(slot, i) {
                var $slot = $('<div class="dnd_pillars-ad-slot" data-id="' + i + '"><div class="dnd_pillars-ad-slot-label"></div></div>');
                $slot.data('data-id', '');
                $slotContainer.append($slot);
            }.bind(this));

            //fill question
            this.ui.questionContainer.html(curQuestion.question);
            this.ui.questionContainer.hide();
            this.ui.questionContainer.fadeIn();

            //do everywhere
            for (i = 0; i<curQuestion.everywhere; i++) {
                $adholder = this.$('#adholder-everywhere .ad-holder');
                $draggable = $('<div class="dnd_pillars-ad ad-everywhere" data-id="everywhere"></div>');
                $adholder.append($draggable);
            }
            this.ui.counterEverywhere.html('X ' + curQuestion.everywhere);

            //do platform
            for (i = 0; i<curQuestion.platform; i++) {
                $adholder = this.$('#adholder-platform .ad-holder');
                $draggable = $('<div class="dnd_pillars-ad ad-platform" data-id="platform"></div>');
                $adholder.append($draggable);
            }
            this.ui.counterPlatform.html('X ' + curQuestion.platform);


            this.$('.dnd_pillars-ad-slot').droppable({
                drop: function (e, ui) {
                    var $drag = ui.draggable

                    self.doDrop($drag, $(this));

                },
                tolerance: 'intersect',
                hoverClass: 'over',
                accept: '.dnd_pillars-ad'
            });


            this.$('.dnd_pillars-ad').draggable({
                revert: function (isValid) {
                    var $this = $(this),
                        id = $this.attr('data-id');
                    if (!isValid && $this.parent().hasClass('ui-droppable')) {

                        //self.model.updateCount(id, 1);
                        self.undoDrop($this);
                        return true;
                    }

                    return !isValid;
                },
                revertDuration: 0.3,
                zIndex: 100,
                start: function (event, ui) {
                    var $this = $(this);
                    $this.addClass('dragging');
                },
                stop: function (event, ui) {
                    var $this = $(this);
                    $this.removeClass('dragging');
                    self.updateInventory();
                }
            }).css('position', 'absolute');

            // now fill in any pre-filled items

            this.$('.dnd_pillars-ad-slot').each(function (index, drop) {
                var slot = slots[index],
                    id = slot.prefilled, label,
                    $drop = $(drop),
                    $drag;

                if (id != undefined) {
                    label = id === 'platform' ? 'Platform Specific' : 'Audio Everywhere';
                    $drag = $('<div class="disabled dnd_pillars-ad ad-' + id + '" data-id="' + id + '"></div>');
                    $drop.append($drag);
                    $drop.find('.dnd_pillars-ad-slot-label').html(label);

                    $drag.css(
                        {
                            'top': 0,
                            'left': 0,
                            'position': 'relative'
                        }
                    );

                    $drop.addClass('disabled');

                }


            }.bind(this));

            setTimeout(function () {
                this.$('.dnd_pillars-ad-slot.disabled').droppable('disable');
            }.bind(this), 1000);

        },

        showFeedback: function (content, delay) {
            delay = delay || 0;

            this.feedback.setText(content);

            var correct = this.isCorrect(),
                $popup = this.feedback.$el.find('.popup-view');

            if(correct) {
                $popup.addClass('correct');
            }

            TweenMax.set($popup, {scale: 0.7})
            TweenMax.to($popup, 0.5, {delay:delay, autoAlpha: 1.0, scale: 1.0, ease: Back.easeOut});

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

        doDrop: function ($drag, $drop) {
            var id = $drag.attr('data-id'),
                label = id === 'platform' ? 'Platform Specific' : 'Audio Everywhere',
                $prevDrag = $drop.find('.dnd_pillars-ad');

            if ($prevDrag.length) {
                this.undoDrop($prevDrag);
            }

            $drop.append($drag);
            $drop.find('.dnd_pillars-ad-slot-label').html(label);

            $drag.css(
                {
                    'top': 0,
                    'left': 0,
                    'position': 'relative'
                }
            );

            vent.trigger('play_sfx', 'drag_drop');
        },

        undoDrop: function ($drag) {
            var $drop = $drag.data('$drop'),
                id = $drag.attr('data-id'),
                $adholder = this.$('#adholder-' + id + ' .ad-holder');

            $drag.css(
                {
                    'top': 0,
                    'left': 0,
                    'position': 'absolute'
                }
            );

            if($drop) $drop.data('data-id', '');

            $adholder.append($drag);
        },

        updateInventory: function () {
            var curQuestion = this.model.curQuestion,
                numplatform = curQuestion.platform,
                numeverywhere = curQuestion.everywhere;

            var slotInventory = [];

            this.$('.dnd_pillars-ad-slot').not('.disabled').each(function (index, drop) {
                var id = undefined, $drop = $(drop), label = '';
                if ($drop.find('.dnd_pillars-ad')) {
                    id = $drop.find('.dnd_pillars-ad').attr('data-id'), label = '';
                    if (id == 'platform') {
                        numplatform --;
                        label = 'Platform- Specific';

                    }else if (id == 'everywhere') {
                        numeverywhere --;
                        label = 'Audio Everywhere'
                    }
                    $drop.find('.dnd_pillars-ad-slot-label').html(label);


                }

                trace("nSlots: ", 4);

                $drop.data('data-id', id);
                slotInventory.push(id);
            }.bind(this));


            this.buttonEnable(this.ui.submitButton, (numeverywhere == 0 && numplatform == 0) );

            this.ui.counterEverywhere.html('X ' + numeverywhere);
            this.ui.counterPlatform.html('X ' + numplatform);
        },
        
        isCorrect: function () {
            var slots = this.model.curQuestion.slots, slot,
                $slot, dataID,
                allCorrect = true;
            this.$('.dnd_pillars-ad-slot').each(function (index, el) {
                $slot = $(el);
                dataID = $slot.data('data-id');
                slot = slots[index].accept;
                
                if (dataID != '' && slot.indexOf(dataID) < 0) {
                    allCorrect = false;
                    return;
                }
                
            }.bind(this));  
            
            return allCorrect;
        },

        resetIncorrectAnswers: function () {
            var slots = this.model.curQuestion.slots, slot,
                $slot, dataID, $drag;
            this.$('.dnd_pillars-ad-slot').each(function (index, el) {
                $slot = $(el);
                dataID = $slot.data('data-id');
                slot = slots[index].accept;

                if (dataID != '' && slot.indexOf(dataID) < 0) {
                    $drag = $slot.find('.dnd_pillars-ad');

                    if ($drag.length) {
                        this.undoDrop($drag);
                    }
                    $slot.data('data-id', '');
                }

            }.bind(this));

            this.updateInventory();
        },

        checkAnswers: function () {
            var allCorrect = this.isCorrect(),
                feedback = this.model.curQuestion.feedback,
                feedbackObj = allCorrect ? feedback.correct : feedback.wrong;

            this.showFeedback(feedbackObj);
        },
        
        onFeedbackDismissed: function () {
            this.hideFeedback(0);

            if (this.isCorrect()) {
                this.model.nextQuestion(1);
            } else {
                this.resetIncorrectAnswers();
            }

        },

        constructInteraction: function () {

        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onDestroy: function () {
        }
    });

});