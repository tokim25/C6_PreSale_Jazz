/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Click Reveal',

        ui: {
            //
            textbox: '.popup-text-box',
            instrux: '.onscreen-instrux',
            itemsContainer: '.items-container',
            revealItems: '.cr-item',
            tooltip: '.tool-tip',
            closeButton: '.close-x-button',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.closeButton': 'onButtonClicked',
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.revealItems.enabled': 'onRevealItemClicked',
            'mouseover @ui.revealItems.enabled': 'onRevealItemOver',
            'mouseout @ui.revealItems.enabled': 'onRevealItemOut'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.soundPlayer = options.soundPlayer;
            this.completedItems = [];
            this.totalItems = this.model.get('items').length;
            this.completed = false;

            this.$currentItem = null;
            this.currentItem = null;
        },

        onRender: function() {

            this.ui.scrim.hide();

            TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});

            TweenMax.staggerTo(this.ui.revealItems, 0.01, {delay: 0.75, className: '+=active'}, 0.3);

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

            TweenMax.staggerTo(this.ui.revealItems, 0.01, {className: '+=enabled'}, 0.3);
            TweenMax.set(this.ui.instrux, {className: '+=active'});
        },

        onRevealItemClicked: function (e) {

            var $revealItem = $(e.currentTarget),
                index = parseInt($revealItem.attr('data-id')),
                item = this.model.get('items')[index],
                $content = this.ui.textbox.find('.content'),
                $image = this.ui.textbox.find('.cr-image');

            if (this.$currentItem) {
                this.$currentItem.removeClass('selected');
                this.ui.textbox.removeClass(this.currentItem.id);
            }

            this.$currentItem = $revealItem;
            this.currentItem = item;
            this.ui.textbox.addClass(this.currentItem.id);

            this.update(index);
            $revealItem.addClass('selected');
            $revealItem.addClass('completed');

            $('.reveal-item').removeClass('selected');
            $revealItem.addClass('selected');

            if (item.body != undefined) {
                this.showText();

                // check to see if body is already wrapped in <p> tags
                item.body = this.wrapInP(item.body);

                if (item.title != '') {
                    $content.html('<h2>' + item.title + '</h2>' + item.body);
                } else {
                    $content.html(item.body);
                }


                vent.trigger('play_sfx', 'revealitem-click');
            } else if (item.audioID != undefined && item.audioID != '') {
                this.soundPlayer.playSound(item.audioID);
            }

            if (item.image != undefined) {
                $image.attr('src', item.image);
            }

        },

        onRevealItemOver: function (e) {
            var $revealItem = $(e.currentTarget),
                index = parseInt($revealItem.attr('data-id')),
                item = this.model.get('items')[index],
                $hover = this.ui.tooltip,
                hover = item.hover,
                pos = $revealItem.offset();

            if (hover != undefined && $hover.length) {
                this.$currentItem = $revealItem;
                this.currentItem = item;
                TweenMax.killTweensOf(this.ui.tooltip);
                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
                $hover.html(hover);
                TweenMax.set($hover, {autoAlpha: 1});
                $hover.css({
                    left: pos.left + 25 - this.$el.offset().left + 'px',
                    top: pos.top - ($hover.height()+5) + 'px'
                });
                TweenMax.set($hover, {autoAlpha: 0});
                //enter

                TweenMax.to($hover, 0.3, {delay: 0.1, autoAlpha:1.0});

            }

        },
        onRevealItemOut: function (e) {
            var $hover = this.ui.tooltip;

            if (this.$currentItem && this.$currentItem == $(e.currentTarget)) {
                return;
            }

            if ($hover.length) {
                //leave
                TweenMax.killTweensOf(this.ui.tooltip);
                if (this.$currentItem) {
                    TweenMax.to(this.ui.tooltip, 0.3, {autoAlpha: 0.0, onComplete: function () {this.$currentItem = null;}.bind(this)});
                } else {
                    TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
                }
            }

        },

        wrapInP: function (text) {
            if (text.indexOf('<p>') < 0) {
                text = '<p>' + text + '</p>';
            }

            return text;
        },

        showText: function () {
            TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
            TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 1.0});
            //TweenMax.to(this.ui.instrux, 0.5, {autoAlpha: 0.0});
            this.ui.instrux.removeClass('active');

        },

        hideText: function () {
            TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
            //TweenMax.to(this.ui.instrux, 0.5, {autoAlpha: 1.0});
            this.ui.instrux.addClass('active');
        },

        update: function (index) {
            if (this.completedItems.indexOf(index) <0) {
                this.completedItems.push(index);
            }

            if(this.completedItems.length == this.totalItems) {
                this.setCompleted(true);
            }

            if (this.isComplete()) {
                this.buttonEnable(this.ui.continueButton, true);
            }
        },

        isComplete: function () {
            return this.completed;
        },

        setCompleted: function (bool) {
            this.completed = bool;
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

            switch(dataID) {
                case 'close':
                    if (this.$currentItem) {
                        this.$currentItem.removeClass('selected');
                        this.$currentItem = null;
                    }
                    this.hideText();
                    break;
                case 'continue':
                    this.endInteraction();
                    break;
            }


        },

        endInteraction: function () {
            this.soundPlayer.killCurrentSound();
            this.trigger('interaction:complete', this.model);
        }


    });

});
