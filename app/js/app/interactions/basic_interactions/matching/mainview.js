/**
 * Created by jhoffsis on 6/30/16.
 */


/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
        "app/vent"],
    function (Marionette, vent) {
        return Marionette.ItemView.extend({

            name: "Matching",

            ui: {
                //
                textbox: '.popup-text-box',
                checkansButton: '.checkans-button',
                okButton: '.ok-button',
                draggables: '.drag-item',
                droppables: '.drag-target',
                dragContainer: '.drag-container',
                dropContainer: '.target-container',
                undoButton: '.undo-button',
                scrim: '.scrim-background'
            },

            events: {
                'click @ui.okButton': 'onButtonClicked',
                'click @ui.checkansButton': 'onButtonClicked',
                'click @ui.undoButton': 'undoDrag'
            },

            initialize: function (options) {
                this.template = options.template;
                this.model = options.model;
                this.listenTo(this.model, 'model:update', this.onModelUpdate)
                trace('mainview: initialize()');

            },

            onRender: function () {
                trace('mainview: onRender()');

                setTimeout(function () {
                    this.constructInteraction();
                }.bind(this), 500);

                this.ui.scrim.hide();

                this.ui.checkansButton.removeClass('enabled').addClass('disabled');

                this.ui.undoButton.hide();

                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});

            },

            startInteraction: function () {

            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');
                switch (dataID) {
                    case 'checkans':
                        this.checkAnswers();
                        break;
                    case 'ok':
                        this.onFeedbackDismissed();
                        break;
                }

            },

            checkAnswers: function () {
                var allCorrect = this.model.allCorrect(),
                    feedback = allCorrect ? this.model.get('feedback').correct : this.model.get('feedback').incorrect,
                    feedbackObj = {
                        header: '<h2>' + feedback.header + '</h2>',
                        body: '<p>' + feedback.body + '</p>'
                    };

                this.showFeedback(feedbackObj);
            },

            onFeedbackDismissed: function () {
                TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});

                if(this.model.allCorrect()) {
                    this.endInteraction();
                } else {
                    this.hideFeedback();
                    this.resetDrags();
                }
            },

            showFeedback: function (content, delay) {
                this.ui.textbox.find('.content').html(content.header + content.body);

                TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});

                TweenMax.to(this.ui.textbox, 0.5, {delay: delay, autoAlpha: 1.0});
                this.ui.scrim.fadeIn(300);
                this.buttonEnable(this.ui.checkansButton, false);
            },

            hideFeedback: function (delay) {
                delay = delay || 0;
                TweenMax.to(this.ui.textbox, 0.5, {delay: delay, autoAlpha: 0.0});
                this.ui.scrim.fadeOut(300);
            },

            resetDrags: function () {
                this.model.resetCount();
                this.ui.draggables.each(function () {
                    $(this).show();
                });
                this.ui.droppables.each(function () {
                    var $drop = $(this);
                    $drop.data('curID', '');
                    //$drop.find('h1').html('-- ? --');
                    $drop.removeClass('dropped');
                });
                this.buttonEnable(this.ui.checkansButton, false);
                this.ui.undoButton.hide();
            },

            disableDrag: function($drag, $drop) {


            },

            onModelUpdate: function (complete) {

                this.buttonEnable(this.ui.checkansButton, complete);
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
                    $drop.find('.matching-description').html('');
                    $drop.removeClass('dropped');
                    this.model.unsetID(dropID, curID);
                }

                $button.hide();
            },

            endInteraction: function () {
                this.trigger('interaction:complete', this.model);
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
                    /*revert: function () {
                        var $this = $(this);
                        TweenMax.to($this, 0.3, {left: $this.data('left'), top: $this.data('top'), ease: Circ.easeOut});
                        return false;
                    },*/
                    revert: true,
                    revertDuration: 200,
                    zIndex: 100,
                    start: function (event, ui) {
                        var $this = $(this);
                        $this.addClass('dragging');
                        $this.draggable("option", "cursorAt", {
                            left: Math.floor($this.width() / 2),
                            top: Math.floor($this.height() / 2)
                        });
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
                            item = self.model.getItemForID(dragID),
                            curID = $drop.data('curID'),
                            $oldDrag;

                        if (curID != undefined && curID != '') {
                            $oldDrag = self.$('.drag-item[data-id=' + curID + ']');
                            $oldDrag.show();
                            self.model.unsetID(dropID, curID);
                        }

                        $drop.data('curID', dragID);
                        //$drop.find('h1').html(item.title);
                        $drop.find('.matching-description').html(item.description);
                        $drop.addClass('dropped');
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