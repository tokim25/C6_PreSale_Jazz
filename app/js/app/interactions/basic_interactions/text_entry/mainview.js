/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Text Entry',

        ui: {
            //
            textInput: '.text-input',
            instrux: '.onscreen-instrux',
            teContainer: '#te-container',
            scenarioContainer: '.te-scenario',
            displayContainer: '#display-container',
            blobContainer: '.te-blob',
            continueButton: '.te-view > .continue-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'keypress @ui.textInput': 'onTextUpdate'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.hasDisplay = false;
            this.entryPhase = true;

            var display = this.model.get('display');
            var scenario = this.model.get('scenario');
            var blob = this.model.get('blob');

            if (display != undefined && display.answer != undefined && display.answer.title != '') {
                this.hasDisplay = true;
            }

            if (scenario != undefined) {
                this.hasScenario = true;
            }

            if (blob != undefined) {
                this.hasBlob = true;
            }

            TweenMax.set(this.ui.displayContainer, {autoAlpha: 0});
        },

        onRender: function() {

            this.ui.scrim.hide();

            this.constructInteraction();

            TweenMax.set(this.ui.teContainer, {autoAlpha: 0.0});
            TweenMax.set(this.ui.displayContainer, {autoAlpha: 0.0});

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

            TweenMax.to(this.ui.teContainer, 0.5, {autoAlpha: 1.0});

            setTimeout(function () {
                this.ui.textInput.focus();
            }.bind(this), 1000);
        },

        onTextUpdate: function (e) {
            var input = this.ui.textInput.val();

            if (input == '') {
                this.buttonEnable(this.ui.continueButton, false);
            } else if (this.ui.continueButton.hasClass('disabled')) {
                this.buttonEnable(this.ui.continueButton, true);
            }


        },


        update: function (index) {
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

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            e.stopImmediatePropagation();
            switch(dataID) {
                case 'continue':
                    if (!this.entryPhase || (this.entryPhase && !this.hasDisplay)) {
                        this.endInteraction();
                    } else {
                        this.showDisplay();
                        if(this.model.get('duration') != undefined) {
                            this.trigger('interaction:continue', this.model);
                        }
                        this.buttonEnable(this.ui.continueButton, false);
                    }

                    break;
            }

            return false;
        },

        showDisplay: function () {
            this.$('.te-view').addClass('unpaused');
            this.entryPhase = false;
            this.$('.te-user-selection').html(this.ui.textInput.val());
            this.ui.teContainer.remove();
            this.ui.scenarioContainer.addClass('hidden');
            TweenMax.to(this.ui.blobContainer, 0.5, {autoAlpha: 0.0});

            TweenMax.to(this.ui.displayContainer, 0.5, {autoAlpha: 1.0});
        },

        endInteraction: function () {
            var input = this.ui.textInput.val();

            this.model.set('input', input);

            this.trigger('interaction:complete', this.model);
        },

        constructInteraction: function () {
            if (this.hasDisplay) {
                var display = this.model.get('display'),
                    $display;

                if(display.example != undefined && display.example.body != '') {
                    $display = '<div class="display-example"><h2>' + display.example.title + '</h2>'
                        + '<p>' + display.example.body + '</p></div>'
                        + '<div class="display-answer"><h2>' + display.answer.title + '</h2>'
                        + '<p class="te-user-selection"></p></div>';
                } else {
                    $display = '<div class="display-answer"><h2>' + display.answer.title + '</h2>'
                        + '<p class="te-user-selection"></p></div>';
                }
                this.ui.displayContainer.append($display);
            }

            if (this.hasScenario) {
                var scenario = this.model.get('scenario');
                this.ui.scenarioContainer.find('h3').html(scenario);
            }
        },

        fadeDisplay: function () {
            TweenMax.to(this.ui.displayContainer, 0.5, {autoAlpha: 0.0, onCompleteScope: this, onComplete: this.endInteraction});
        },

        stopInteraction: function () {
            this.fadeDisplay();
        },


    });

});