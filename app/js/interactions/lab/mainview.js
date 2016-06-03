/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "interactions/lab/lab_popup",
    "ui/splash",
    "text!templates/interactions/lab/mainview.html",
    "text!templates/interactions/lab/popup_lab.html"], function (Marionette, vent, LabPopup, Splash, text, labtext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            labContainer: '.lab-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            continueButton: '.continue-button'
        },

        events : {
            'click .main-button': 'onButtonClicked'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            //this.listenTo(this.model, 'model:update', this.onModelUpdate);

        },

        onRender: function() {
            var labObj = {
                'template': labtext,
                'items': this.model.get('lab'),
                'showTitle': true,
                'title': '',
                'body': '',
                buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Next'}],
                'containerClass': 'lab-popup'
            }
            this.lab = new LabPopup(labObj);
            this.listenToOnce(this.lab, 'popup:complete', this.onLabComplete);

            this.ui.labContainer.append(this.lab.render().el);

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

            this.buttonEnable(this.ui.continueButton, false);

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();
            this.trigger('mainview:activity-start');
            //this.showConclusion();
            this.lab.fadeIn();
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');
            switch (dataID) {
                case 'continue':
                    this.showConclusion();
                    break;
                default:
                    break;
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

        onLabComplete: function () {
            this.lab.fadeOut();
            this.showConclusion();
        },

        constructInteraction: function () {

        },

        showText: function (textObj) {
            this.textbox.$el.fadeOut(function () {
                this.textbox.setText(textObj);
                this.textbox.$el.fadeIn();
            }.bind(this));
        },

        hideText: function () {
            this.textbox.$el.fadeOut()
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onDestroy: function () {
            //
        }
    });

});