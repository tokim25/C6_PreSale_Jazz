/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Multi Text Entry',

        ui: {
            //
            textInput: '.text-input',
            instrux: '.onscreen-instrux',
            teContainer: '#te-container',
            displayContainer: '#display-container',
            continueButton: '.multi-te-view > .continue-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'keyup @ui.textInput': 'onTextUpdate'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.hasDisplay = false;
            this.entryPhase = true;

            var display = this.model.get('display');

            if (display != undefined && display.example != undefined && display.example.body != '') {
                this.hasDisplay = true;
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
            var allComplete = true,
                $input;

            this.ui.textInput.each(function (e) {
                $input = $(this);
                if($input.val() == '') {
                    allComplete = false;
                }
            })

            if (!allComplete) {
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
                    }

                    break;
            }

            return false;
        },

        showDisplay: function () {
            this.entryPhase = false;
            this.$('.te-user-selection').html(this.ui.textInput.val());
            TweenMax.to(this.ui.teContainer, 0.5, {autoAlpha: 0.0});

            TweenMax.to(this.ui.displayContainer, 0.5, {autoAlpha: 1.0});
        },

        endInteraction: function () {
            var input = [];

            this.ui.textInput.each(function (e) {
                $input = $(this);
                input.push($input.val());
            })

            this.model.set('input', input);

            this.trigger('interaction:complete', this.model);
        },

        constructInteraction: function () {
            if (this.hasDisplay) {
                var display = this.model.get('display'),
                    $display = '<div class="display-example"><h2>' + display.example.title + '</h2>'
                                + '<p>' + display.example.body + '</p></div>'
                                + '<div class="display-answer"><h2>' + display.answer.title + '</h2>'
                                + '<p class="te-user-selection"></p></div>';
                this.ui.displayContainer.append($display);
            }
        }


    });

});