/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/mix1/mainview.html",
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
            recordArm: '.mr-record-arm',
            record: '.mr-record',
            product: '.mr-product',
            productButton: '.mr-product-button',
            doneLight: '.mr-done-light'
        },

        events : {
            'click .main-button': 'onButtonClicked',
            'click @ui.productButton': 'onProductClicked'
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
                'containerClass': ''
            }
            this.textbox = new Popup(textObj);

            this.ui.textboxContainer.append(this.textbox.render().el);

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

            TweenMax.to(this.ui.recordArm, 1.5, {delay: 0.5, rotation: '18deg', transformOrigin: '91px 103px', ease:Power1.easeOut});
            TweenMax.to(this.ui.record, 3.0, {delay: 1.0, rotation: '360deg', repeat: -1, ease: Linear.easeNone});
            setTimeout(function () {
                vent.trigger('play_sfx', 'vinyl_scratch');
            }.bind(this), 500);

        },

        onInteractionComplete: function () {
            this.showConclusion();
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

        onModelUpdate: function () {
            if (this.model.isComplete()) {
                this.buttonEnable(this.ui.continueButton, true);
            }
        },

        onProductClicked: function (e) {
            var $button = $(e.currentTarget), $doneLight,
                dataID = $button.parent().attr('data-id'),
                type = $button.hasClass('mr-features') ? 'features': 'benefits',
                numProducts = this.model.products.length,
                audioID = type + '_' + numProducts,
                product, textObj, title;

            this.model.setItem(dataID, type);

            product = this.model.currentProduct;
            title = product.get('title') != undefined ? product.get('title') : product.get('label');
            textObj = {
                header: title,
                body: '<h2>' + type.toUpperCase() + '</h2>' + product.get('specs')[type]
            };

            if (this.$currentButton != undefined) {
                this.$currentButton.removeClass('selected').addClass('completed');
            }
            if (this.$currentDoneLight != undefined) {
                this.$currentDoneLight.removeClass('selected').addClass('completed');
            }
            $doneLight = $button.parent().find('.mr-done-light.mr-' + type);
            $button.addClass('selected');
            $doneLight.addClass('selected');

            this.$currentDoneLight = $doneLight;
            this.$currentButton = $button;

            vent.trigger('play_sfx', audioID);

            this.showText(textObj);
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

        onDestroy: function () {
            //
            TweenMax.killTweensOf(this.ui.record);
        }
    });

});