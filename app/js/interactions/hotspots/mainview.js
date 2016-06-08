/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/hotspots/mainview.html",
    "text!templates/ui/popup_feedback.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            moduleTitle: '.module-title',
            textboxContainer: '.feedback-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            continueButton: '.continue-button',
            mainContainer: '.items-container',
            detailsContainer: '.details-container',
            mainItem: '.item-container',
            detailItem: '.detail-info-button',
            detailSets: '.detail-set',
            tooltip: '.details-container .tooltip',
            tooltipBody: '.details-container .tooltip .tooltip-body',
            detailHighlight: '.details-container .detail-highlight',

            scrim: '.scrim-background'
            
        },

        events: {
            'click .back-button': 'onButtonClicked',
            'mouseover @ui.detailItem': 'onDetailOver',
            'mouseout @ui.detailItem': 'onDetailOut',
            'click @ui.mainItem': 'onMainItemClicked',
            'click @ui.detailItem': 'onDetailClicked',
            'click @ui.tooltip .close-x-light-button': 'onCloseClicked'
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
                'buttons': [],
                'containerClass': ''
            }
            this.textbox = new Popup(textObj);


            this.ui.detailsContainer.append(this.textbox.render().el);
            //this.listenTo(this.textbox, 'ok:clicked', this.onTextboxClosed);

            this.ui.popupView = this.textbox.$el.find('.fancy-popup .content');

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

            TweenMax.set(this.ui.detailsContainer, {autoAlpha: 0.0});
            TweenMax.set(this.ui.detailSets, {autoAlpha: 0.0});
            this.textbox.$el.show();
            this.ui.popupView.hide();
            this.splash.show();
            this.ui.scrim.hide();
            this.ui.tooltip.hide();
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
                TweenMax.set(this.$currentSet, {autoAlpha: 0.0});
            }

            TweenMax.set($currentSet, {autoAlpha: 1.0});
            this.$currentSet = $currentSet;
            this.hideText();

            this.model.setItem(itemID);

            //TweenMax.to(this.ui.mainContainer, 0.5, {autoAlpha: 0.0});
            TweenMax.to(this.ui.detailsContainer, 0.5, {autoAlpha: 1.0});


            this.stopAnimation();
            this.doAnimation();

            this.ui.scrim.fadeIn();

        },

        onDetailOver: function (e) {
            var $currentDetail = $(e.currentTarget),
                detailID = $currentDetail.attr('data-id'),
                indexID = $currentDetail.attr('data-index'),
                detail = this.model.getDetailForID(detailID),
                pos = $currentDetail.position(),
                parentWidth = $currentDetail.parent().width(),
                parentHeight = $currentDetail.parent().height(),
                coords = {};

            this.$('.detail-info-button').removeClass('selected');

            this.ui.tooltip.hide();
            this.ui.tooltip.removeClass('visible');
            this.ui.tooltipBody.hide();
            this.ui.tooltip.find('.label').html(detail.label);

            switch (detail.direction) {
                case 'left-top':
                    coords = {
                        top: pos.top + 'px',
                        left: pos.left + 45 + 'px',
                        right: 'auto',
                        bottom: 'auto'
                    };
                    break;
                case 'right-top':
                    coords = {
                        top: pos.top + 'px',
                        right: parentWidth - pos.left + 10 + 'px',
                        left: 'auto',
                        bottom: 'auto'
                    };
                    break;
                case 'left-bottom':
                    coords = {
                        bottom: parentHeight - pos.top - 35 + 'px',
                        left: pos.left + 45 + 'px',
                        right: 'auto',
                        top: 'auto'
                    };
                    break;
                case 'right-bottom':
                    coords = {
                        bottom: parentHeight - pos.top - 35 + 'px',
                        right: parentWidth - pos.left + 10 + 'px',
                        left: 'auto',
                        top: 'auto'
                    };
                    break;
            }
            this.ui.tooltip.css(coords);
            this.ui.tooltip.fadeIn();
            this.showHighlight(detail);

        },

        onDetailOut: function (e) {
            var $currentDetail = $(e.currentTarget);

            if ($currentDetail.hasClass('selected')) return;
            this.hideHighlightAndTooltip();

        },

        onDetailClicked: function (e) {


            var $currentDetail = $(e.currentTarget),
                detailID = $currentDetail.attr('data-id'),
                indexID = $currentDetail.attr('data-index'),
                detail = this.model.getDetailForID(detailID);

            if (this.$currentDetail) {
                this.$currentDetail.removeClass('selected');
            }

            $currentDetail.addClass('selected completed');
            this.$currentDetail = $currentDetail;

            this.model.setDetail(detailID);
            //detail = this.model.getDetail;

            this.showHighlight(detail);


            this.ui.tooltipBody.html(detail.body);

            setTimeout(function () {
                this.ui.tooltip.addClass('visible');
                TweenMax.set(this.ui.tooltipBody, {height: "auto"});
                this.ui.tooltipBody.show();
                this.ui.tooltipBody[0].offsetHeight;
                var ht = this.ui.tooltipBody.height();
                TweenMax.set(this.ui.tooltipBody, {height: 0});
                TweenMax.to(this.ui.tooltipBody, 0.5, {height: ht});
            }.bind(this), 100);

            /*this.ui.tooltipBody.slideDown(function() {
                $(this).animate({"opacity": 1});
            })*/

            if (this.model.setComplete()) {
                this.$currentItem.addClass('completed');
            }

        },

        onCloseClicked: function () {
            this.hideHighlightAndTooltip();
        },

        showHighlight: function (detail) {

            this.ui.detailHighlight.css({
                top: detail.hotspot.y + 'px',
                left: detail.hotspot.x + 'px',
                width: detail.hotspot.width + 'px',
                height: detail.hotspot.height + 'px'
            });

            this.ui.detailHighlight.show();
        },

        hideHighlightAndTooltip: function () {
            this.ui.tooltip.removeClass('visible');
            this.ui.tooltip.fadeOut();
            this.ui.tooltipBody.html('');
            TweenMax.set(this.ui.tooltipBody, {height: 0});
            this.ui.tooltipBody.hide();
            this.ui.detailHighlight.hide();
        },

        onDetailComplete: function () {
            TweenMax.to(this.ui.mainContainer, 0.5, {autoAlpha: 1.0});
            TweenMax.to(this.ui.detailsContainer, 0.5, {autoAlpha: 0.0});
            if (this.$currentDetail) {
                this.$currentDetail.removeClass('selected').addClass('completed');
            }
            this.ui.scrim.fadeOut();
            this.hideHighlightAndTooltip();
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

            switch (dataID) {
                case 'continue':
                    this.showConclusion();
                    break;
                case 'back':
                    this.onDetailComplete();
                    break;
            }



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
            this.ui.popupView.fadeIn();
        },

        hideText: function () {
            this.ui.popupView.fadeOut()
        },

        startAnimation: function (dataID) {
        },

        stopAnimation: function () {
            //this.anim_tl.pause();
            //TweenMax.set(this.ui.anim, {autoAlpha: 0.0})
        },

        doAnimation: function () {
            //this.anim_tl.play(0);
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
            /*
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
            */
        },


        onDestroy: function () {
            /*this.stopAnimation();
            this.anim_tl.kill();*/
        }


    });

});