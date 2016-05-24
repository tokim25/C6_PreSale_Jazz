/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/discoballs/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            textboxContainer: '.popup-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            continueButton: '.continue-button',
            detailsContainer: '#discoballs-details-container',
            anim: '.discoballs-dryice',
            details: '.discoballs-shoes',
            mainItem: '.discoballs-ball',
            detailItem: '.discoballs-shoe'
            
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.mainItem': 'onMainItemClicked',
            'click @ui.detailItem': 'onDetailClicked'
        },

        initialize: function (options) {
            this.model = options.model;
            this.anim_tl = null;
            this.$currentItem = null;
            this.$currentDetail = null;
            this.$currentSet = null;
            this.listenTo(this.model, 'model:update', this.onModelUpdate);
            trace('mainview: initialize()');
        },

        onRender: function () {
            trace('mainview: onRender()');

            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'ok', 'label': 'okay'}],
                'containerClass': 'glow-pink-popup'
            }
            this.textbox = new Popup(textObj);

            this.ui.textboxContainer.append(this.textbox.render().el);
            this.listenTo(this.textbox, 'ok:clicked', this.onTextboxClosed);

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

        onMainItemClicked: function (e) {
            //TODO: Decide - DO TOGGLE?

            var $currentItem = $(e.currentTarget),
                itemID = $currentItem.attr('data-id'),
                $currentSet = this.ui.detailsContainer.find('[data-id="' + itemID + '"]');


            if(this.$currentItem) {
                this.$currentItem.removeClass('selected');
            }
            $currentItem.addClass('selected');
            this.$currentItem = $currentItem;

            if (this.$currentSet) {
                TweenMax.to(this.$currentSet, 1.0, {autoAlpha: 0.0});
            }

            TweenMax.to($currentSet, 1.0, {delay: 0.5, autoAlpha: 1.0});
            this.$currentSet = $currentSet;

            this.model.setItem(itemID);

            this.stopAnimation();
            this.doAnimation();

        },

        onDetailClicked: function (e) {

            var $currentDetail = $(e.currentTarget),
                detailID = $currentDetail.attr('data-id'),
                detail, textObj = {};

            if (this.$currentDetail) {
                this.$currentDetail.removeClass('selected');
            }
            $currentDetail.addClass('selected completed');
            this.$currentDetail = $currentDetail;

            this.model.setDetail(detailID);
            //detail = this.model.getDetail;

            textObj = this.model.getDetailText();

            this.showText(textObj);

            if (this.model.setComplete()) {
                this.$currentItem.addClass('completed');
            }

            if (this.model.allComplete()) {
                this.buttonEnable(this.ui.continueButton, true);
            }

        },

        reset: function () {

        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            this.showConclusion();

            vent.trigger('play_sfx', 'button_click');
        },

        onTextboxClosed: function () {

            if (this.$currentDetail) {
                this.$currentDetail.removeClass('selected').addClass('completed');
            }
            this.hideText();

        },

        showText: function (textObj) {

            this.textbox.setText(textObj);
            this.textbox.$el.fadeIn();
        },

        hideText: function () {
            this.textbox.$el.fadeOut()
        },

        startAnimation: function (dataID) {
        },

        stopAnimation: function () {
            //this.anim_tl.seek(0);
            this.anim_tl.pause();
            //TweenMax.set(this.ui.anim, {autoAlpha: 0.0})
        },

        doAnimation: function () {
            this.anim_tl.play(0);
        },

        onAnimComplete: function () {
            this.stopAnimation();
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
            TweenMax.set(this.ui.anim, {autoAlpha: 0.0});
            this.anim_tl = new TimelineMax({
                paused: true,
                onComplete: this.onAnimComplete,
                onCompleteScope: this
            });

            this.anim_tl
                .add([
                    TweenMax.fromTo(this.ui.anim, 1.5, {autoAlpha: 0.0}, {autoAlpha: 1.0}),
                    TweenMax.to(this.ui.anim, 3.0, {scaleX:1.2, scaleY: 1.5, transformOrigin: 'center bottom', ease:Sine.easeOut}),
                    TweenMax.to(this.ui.anim, 2.0, {delay:1, autoAlpha: 0.0})
                ])


            TweenMax.set(this.ui.details, {autoAlpha: 0.0});
        },


        onDestroy: function () {
            this.stopAnimation();
            this.anim_tl.kill();
        }


    });

});