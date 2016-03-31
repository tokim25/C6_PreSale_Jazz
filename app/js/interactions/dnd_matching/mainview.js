/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/dnd_matching/mainview.html",
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
            draggables: '.players-polaroid-container .players-polaroid',
            proxies: '.players-description .players-polaroid',
            droppables: '.players-description',
            dragContainer: '.players-polaroid-container',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.submitButton': 'onButtonClicked'
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
                'body': '<p>The new and improved popup title, fo sho! O, wait, this is complete crap!</p>',
                'buttons': [
                    {'id': 'ok', 'label': 'OK'}
                ],
                'containerClass': 'vintagemarquee-popup'
            }
            this.feedback = new Popup(feedbackObj);
            this.listenTo(this.feedback, 'ok:clicked', this.onFeedbackDismissed);

            this.ui.feedbackContainer.append(this.feedback.render().el);

            var splashObj = {
                colors: this.model.get('colors'),
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
                    colors: this.model.get('colors'),
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

            this.ui.submitButton.removeClass('enabled').addClass('disabled')

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
            this.$('.drag-holder').empty();
            this.ui.draggables.each(function () {
                $(this).show();
            });

            this.ui.proxies.each(function () {
                $(this).hide();
                $(this).data('$drag', null);
            });

        },

        disableDrag: function($drag, $drop) {
            var $proxy = $drop.find('.players-polaroid'),
                snapClass = $proxy.attr('data-snap'),
                id = $drag.attr('data-id'),
                item = _.find(this.model.get('items'), function (item) {
                    return item.id == id;
                });
            //$drag.draggable('disable');

            $drag.hide();
            $proxy.find('.players-polaroid-frame').addClass(snapClass);
            $proxy.find('.players-polaroid-pic').attr('src', 'assets/images/players/' + item.id + '.jpg')
            $proxy.find('.players-polaroid-label').html(item.title);

            $proxy.data('$drag', $drag);
            $proxy.data('snapClass', snapClass);
            $proxy.show();

        },

        onModelUpdate: function (complete) {
            /*if(complete) {
                this.ui.submitButton.addClass('enabled').removeClass('disabled');
            } else {
                this.ui.submitButton.removeClass('enabled').addClass('disabled');
            }*/
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
                    TweenMax.to($this, 0.3, {left: $this.data('left'), top: $this.data('top')});
                    return false;
                },
                zIndex: 100,
                start: function (event, ui) {
                    $(this).addClass('dragging');
                },
                stop: function(event, ui) {$(this).removeClass('dragging');}
            }).css("position", "absolute");

            this.ui.proxies.each(function () {
                var $this = $(this), pos;
                $this.show();
                pos = $this.position();
                $this.hide();
                $this.data('top', pos.top);
                $this.data('left', pos.left);
                $(this).data('$drag', null);
            });

            this.ui.proxies.draggable({
                revert: function () {
                    var $this = $(this);
                    TweenMax.to($this, 0.3, {left: $this.data('left'), top: $this.data('top')});
                    return false;
                },
                zIndex: 100,
                start: function (event, ui) {
                    var $frame = $(this).find('.players-polaroid-frame'),
                        snapClass = $(this).data('snapClass');
                    $frame.removeClass(snapClass);
                },
                stop: function(event, ui) {$(this).find('.players-polaroid-frame').addClass($(this).data('snapClass'));}
            }).css("position", "absolute");

            this.ui.dragContainer.droppable({
                drop: function (e, ui) {
                    var $proxy = ui.draggable,
                        $drag = $proxy.data('$drag');

                    $drag.show();
                    $proxy.data('$drag', null);
                    $proxy.hide();
                    //setTimeout(function () {
                        self.checkProxies();
                    //}, 500);

                    vent.trigger('play_sfx', 'drag_drop');

                },
                tolerance: 'pointer',
                hoverClass: 'dragging',
                accept: '.players-description .players-polaroid'
            });

            this.ui.droppables.droppable({
                drop: function (e, ui) {
                    var $drag = ui.draggable,
                        $drop = $(this),
                        $proxy = $drop.find('.players-polaroid'),
                        dropID = $drop.attr('data-id'),
                        dragID = $drag.attr('data-id'),
                        $oldDrag = $proxy.data('$drag');

                    self.model.setID(dropID, dragID);

                    trace("predrop", 4)
                    //setTimeout(function () {
                        self.checkProxies();
                    //}, 500);

                    if ($oldDrag != null) {
                        $oldDrag.show();
                        $proxy.data('$drag', null);
                    }

                    vent.trigger('play_sfx', 'drag_drop');
                    self.disableDrag($drag, $drop);

                },
                tolerance: 'intersect',
                hoverClass: 'dragging',
                accept: '.players-polaroid-container .players-polaroid'
            });
        },

        checkProxies: function () {
            this.ui.proxies.each(function () {
                trace('$drag:' + $(this).data('$drag'), 4)
            });
        }
    });

});