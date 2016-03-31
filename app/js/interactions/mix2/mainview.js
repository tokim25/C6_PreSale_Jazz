/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/mix2/mainview.html",
    "text!templates/ui/popup.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext, splashtext, conclusiontext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            textboxContainer: '.popup-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            continueButton: '.continue-button',
            sliders: '.mix2-slider',
            mixContainer: '.mix2-mix-container',
            roleLabels: '.mix2-role-label',
            phaseLabels: '.mix2-phase-label',
            needle: '#vu-needle'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.roles': 'onRoleClicked',
            'click @ui.phases': 'onPhaseClicked'
        },

        initialize: function (options) {
            this.model = options.model;
            this.listenTo(this.model, 'model:update', this.onModelUpdate);
            this.vu_interval = null;
            trace('mainview: initialize()');
        },

        onRender: function () {
            trace('mainview: onRender()');

            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [],
                'containerClass': 'white-box-transparent'
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

            this.ui.continueButton.removeClass('enabled').addClass('disabled')

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.$el.fadeOut();
            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.$el.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        updatePhase: function (roleID, phaseID, $slider) {
            trace("roleID: " + roleID, 4);
            trace("phaseID: " + phaseID, 4);

            if(this.model.currentRole != null && this.model.currentRole != roleID) {
                var $previousSlider = this.$('#mix2-slider-' + this.model.currentRole);
                $previousSlider.slider('value', 0);
            }


            this.model.setRole(roleID);
            var textObj = this.model.setPhase(phaseID);

            this.showText(textObj);

            this.ui.roleLabels.removeClass('selected');
            this.ui.phaseLabels.removeClass('selected');
            this.$('.label-' + roleID).addClass('selected');
            this.$('.label-' + phaseID).addClass('selected');

            this.startVU(phaseID);
        },

        reset: function () {
            this.hideText();
            this.stopVU();
            this.ui.roleLabels.removeClass('selected');
            this.ui.phaseLabels.removeClass('selected');
            this.currentSlider = null;
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            this.showConclusion();

            vent.trigger('play_sfx', 'button_click');
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

        startVU: function (dataID) {
            this.ui.needle.removeClass().addClass('on-' + dataID);
            this.vu_interval = setInterval(function () {
                this.doVU();
            }.bind(this), 1000);
        },

        stopVU: function () {
            this.ui.needle.removeClass();
        },

        doVU: function () {

        },

        onModelUpdate: function (numItems, complete) {
            if(numItems == 4) {
                var roleID = this.model.currentRole,
                    $led = $('#mixcomplete-' + roleID);

                $led.addClass('on');
            }
            if (complete) {
                //this.ui.continueButton.addClass('enabled').removeClass('disabled');
                this.buttonEnable(this.ui.continueButton, true);
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

        constructInteraction: function () {
            var self = this;
            this.ui.sliders.slider({
                orientation: "vertical",
                min: 0,
                max: 240,
                animate: true,
                distance: 10,
                stop: function (e, ui) {
                    var value = Math.round(ui.value / 60),
                        yPos = value / 4 * $(this).height(),
                        $slider = $(this);

                    $slider.slider('value', yPos);

                    if (value == 0) {
                        self.reset();
                        return;
                    }

                    var roleID = $slider.attr('data-id'),
                        phases = self.model.get('text').labels.phases.slice(0).reverse(),
                        phaseID = phases[(value-1)].id,
                        $LED;

                    $LED = $(this).parent().find('.mix2-led-' + value);
                    $LED.addClass('on');
                    self.updatePhase(roleID, phaseID,$slider);
                    vent.trigger('play_sfx', 'drag_grab');
                }
            });
            setTimeout(function () {
                var $img = $('<img class="mix2-slider-handle" src="assets/images/mix2/mix2-phase-button.png" />');
                this.$('.ui-slider-handle').append($img);
            }.bind(this), 200);

            //TweenMax.set(this.ui.mixContainer, {scale: 0.8});
        },


        onDestroy: function () {
            this.stopVU();
        }


    });

});