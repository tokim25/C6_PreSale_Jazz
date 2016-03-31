/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/cassette/mainview.html",
    "text!templates/ui/popup_info.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            textboxContainer: '.info-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            continueButton: '.continue-button',
            draggables: '.cassette-case',
            checkmarks: '.cassette-checkmark-container',
            door: '.cassette-door',
            cassettePlaying: '.cassette-playing',
            ejectButton: '.cassette-eject-button'
        },

        events : {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.ejectButton': 'doEject'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            this.listenTo(this.model, 'model:update', this.onModelUpdate);

        },

        onRender: function() {
            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [],
                'containerClass': 'splatter-popup'
            }
            this.textbox = new Popup(textObj);

            this.ui.textboxContainer.append(this.textbox.render().el);

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


            this.constructInteraction();

            this.buttonEnable(this.ui.continueButton, false);

            this.splash.show();
        },


        startInteraction: function () {
            this.splash.fadeOut();
            this.textbox.$el.show();
            this.hideText();
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

            vent.trigger('play_sfx', 'button_click');

            this.showConclusion();
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
            if (complete) {
                //this.ui.continueButton.addClass('enabled').removeClass('disabled');
                this.buttonEnable(this.ui.continueButton, true);
            }
        },

        showText: function (textObj) {
            var $content = this.textbox.$el.find('.content');
            $content.fadeOut(function () {
                this.textbox.setText(textObj);
                $content.fadeIn();
            }.bind(this));
        },

        hideText: function () {
            var $content = this.textbox.$el.find('.content');

            $content.fadeOut()
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        doDrop: function ($drag) {
            var dragID = $drag.attr('data-id'),
                element = this.model.elements.get(dragID),
                body = element.get('body').slice(0),
                textObj;

            body.unshift('<h2>' + element.get('subheader') + '</h2>');
            textObj = {header: element.get('header'), body: body.join('')};
            this.model.setID(dragID);
            this.ui.cassettePlaying.removeClass().addClass('cassette-playing ' + dragID);
            this.ui.door.removeClass('open');

            setTimeout(function () {$drag.css('opacity', 0.4);}, 10);
            var $checkmark = this.ui.checkmarks.find('[data-id="' + dragID + '"]');

            $checkmark .css('opacity', 1.0);

            if (this.oldDrag != null) {
                this.oldDrag.css('opacity', 1.0);
            }

            this.oldDrag = $drag;
            this.showText(textObj);

            vent.trigger('play_sfx', 'drag_drop');

        },

        doEject: function () {
            if (this.oldDrag != null) {
                this.oldDrag.css('opacity', 1.0);
                this.oldDrag = null;
            }

            this.hideText();

            this.ui.cassettePlaying.removeClass().addClass('cassette-playing');
            this.ui.door.addClass('open');

            vent.trigger('play_sfx', 'eject');
        },

        constructInteraction: function () {
            var self = this;

            this.ui.draggables.draggable({
                revert: 'invalid',
                revertDuration: 0.3,
                helper: function (event, ui) {
                    var id = $(this).attr('data-id'),
                        selector = '<div class="cassette-drag-helper ' + id + '"></div>';

                    return $(selector)

                },
                cursorAt: {top:95, left: 145},
                snap: true,
                zIndex: 100,
                start: function (event, ui) {$(this).css('opacity', 0.4);},
                stop: function (event, ui) {$(this).css('opacity', 1.0);}
            });


            this.ui.door.droppable({
                drop: function (e, ui) {
                    var $drag = ui.draggable

                    self.doDrop($drag);

                },
                tolerance: 'intersect',
                hoverClass: 'open',
                accept: '.cassette-case'
            });
        },

        onDestroy: function () {
        }
    });

});