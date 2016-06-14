/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/dnd_matching/matching-050-mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            feedbackContainer: '.popup-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            submitButton: '.submit-button',
            draggables: '.drag-item',
            droppables: '.drag-target',
            dragContainer: '.drag-container',
            dropContainer: '.target-container',
            undoButton: '.undo-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.submitButton': 'onButtonClicked',
            'click @ui.undoButton': 'undoDrag'
        },

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
                'body': '',
                'buttons': [
                    {'id': 'ok', 'label': 'OK'}
                ],
                'containerClass': 'main-popup'
            }
            this.feedback = new Popup(feedbackObj);
            this.listenTo(this.feedback, 'ok:clicked', this.onFeedbackDismissed);

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

            setTimeout(function () {
                this.constructInteraction();
            }.bind(this), 500);

            this.ui.scrim.hide();

            this.ui.submitButton.removeClass('enabled').addClass('disabled');

            this.ui.undoButton.hide();

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.fadeOut();
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

            this.checkAnswers();
        },

        checkAnswers: function () {
            var allCorrect = this.model.allCorrect(),
                feedback = this.model.get('text').feedback,
                textObj = allCorrect ? feedback.correct : feedback.incorrect;

            this.feedback.setText(textObj);
            this.showFeedback();
        },

        onFeedbackDismissed: function () {
            this.feedback.$el.fadeOut();
            this.ui.scrim.fadeOut();

            if(this.model.allCorrect()) {
                this.showConclusion();
            } else {
                this.resetDrags();
            }
        },

        showFeedback: function () {

            this.feedback.$el.fadeIn();
            this.ui.scrim.fadeIn();
            vent.trigger('play_sfx', 'popup_vintage');

        },

        resetDrags: function () {
            this.model.resetCount();
            this.ui.draggables.each(function () {
                $(this).show();
            });
            this.ui.droppables.each(function () {
                var $drop = $(this);
                $drop.data('curID', '');
                $drop.find('h1').html('-- ? --');
            });

            this.ui.undoButton.hide();
        },

        disableDrag: function($drag, $drop) {


        },

        onModelUpdate: function (complete) {

            this.buttonEnable(this.ui.submitButton, complete);
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

        undoDrag: function (e) {
            var $button = $(e.currentTarget),
                $drop = $button.parent(),
                dropID = $drop.attr('data-id'),
                curID= $drop.data('curID'),
                $oldDrag;

            if (curID != undefined && curID != '') {
                $oldDrag = this.$('.drag-item[data-id=' + curID + ']');
                $oldDrag.show();
                $drop.data('curID', '');
                $drop.find('h1').html('-- ? --');
                this.model.unsetID(dropID, curID);
            }

            $button.hide();
        },

        constructInteraction: function () {
            var self = this;

            this.ui.draggables.each(function () {
                var $this = $(this),
                    pos = $this.position();
                $this.data('top', pos.top);
                $this.data('left', pos.left);
            });

            this.ui.draggables.draggable({
                revert: function () {
                    var $this = $(this);
                    TweenMax.to($this, 0.3, {left: $this.data('left'), top: $this.data('top'), ease: Circ.easeOut});
                    return false;
                },
                zIndex: 100,
                start: function (event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function(event, ui) {$(this).removeClass('dragging');}
            }).css("position", "absolute");

            this.ui.droppables.droppable({
                drop: function (e, ui) {
                    var $drag = ui.draggable,
                        $drop = $(this),
                        $undoButton = $drop.find('.undo-button'),
                        dropID = $drop.attr('data-id'),
                        dragID = $drag.attr('data-id'),
                        newTitle = self.model.getTitleForID(dragID),
                        curID = $drop.data('curID'),
                        $oldDrag;

                    if (curID != undefined && curID != '') {
                        $oldDrag = self.$('.drag-item[data-id=' + curID + ']');
                        $oldDrag.show();
                        self.model.unsetID(dropID, curID);
                    }

                    $drop.data('curID', dragID);
                    $drop.find('h1').html(newTitle);
                    $drag.hide();

                    self.model.setID(dropID, dragID);

                    if ($oldDrag != null) {
                        $oldDrag.show();
                    }

                    $undoButton.show();

                    vent.trigger('play_sfx', 'drag_drop');

                },
                tolerance: 'intersect',
                hoverClass: 'active',
                accept: '.drag-item'
            });
        }
    });

});