/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent", "app/utils/sessionstorage"], function (Marionette, vent, sessionstorage) {
    return Marionette.ItemView.extend({

        name: 'Pageturner',

        ui: {
            //
            instrux: '.onscreen-instrux',
            content: '.pageturner-content',
            items: '.pageturner-item',
            itemImage: '.pageturner-image',
            continueButton: '.continue-button',
            backButton: '.back-button',
            buttons: '.main-button',
            scrim: '.scrim-background'
        },

        currentItem: null,
        $currentItem: null,
        index: -1,
        LOG_LEVEL: 5,

        events: {
            'click @ui.buttons': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;

            this.currentItem = null;
            this.$currentItem = null;
            this.index = -1;
            this.items = this.model.get('items');
        },

        onRender: function() {

            this.ui.scrim.hide();

            this.ui.backButton.addClass('disabled');
            TweenMax.set(this.ui.items, {autoAlpha: 0, display: 'none'});

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');
            this.nextItem();

        },

        show: function () {
            this.$el.show();
        },

        fadeIn: function () {
            this.$el.fadeIn();
        },

        hide: function () {
            this.$el.hide();
        },

        fadeOut: function () {
            this.$el.fadeOut();
        },

        nextItem: function () {
            this.index ++;

            if (this.index <= this.items.length - 1) {
                var itemObj = this.items[this.index];
                this.setItem(itemObj);
            }

            if (this.index == this.items.length - 1) {
                if (this.stopOnLastElement) {
                    this.ui.continueButton.addClass('disabled');
                }
                this.trigger('pageturnerview:last-item');
            } else if (this.index == this.items.length) {
                this.index --;
                this.endInteraction();
                return;
            }

            if(this.index > 0) {
                this.ui.backButton.removeClass('disabled');
            }

        },

        prevItem: function () {
            this.index --;

            if (this.index < 0) {
                this.index = 0;
            }
            if (this.index == 0) {
                this.ui.backButton.addClass('disabled');
            }

            this.ui.continueButton.removeClass('disabled');

            var itemObj = this.items[this.index];
            this.setItem(itemObj);
        },

        setItem: function (itemObj) {

            var tl = new TimelineMax(),
              $newItem = this.$('[data-index=' + this.index + ']');

            this.ui.continueButton.css('pointerEvents', 'none');
            this.ui.backButton.css('pointerEvents', 'none');
            if (this.$currentItem) {
                tl.add(TweenMax.to(this.$currentItem, 0.3, {autoAlpha: 0, display: 'none'}));
            }
            tl.add(TweenMax.to($newItem, 0.4, {autoAlpha: 1, display: 'block', onComplete: this.itemShown, onCompleteParams: [$newItem], onCompleteScope: this}));
        },

        itemShown: function ($newItem) {
            this.$currentItem = $newItem;
            this.ui.continueButton.css('pointerEvents', 'all');
            this.ui.backButton.css('pointerEvents', 'all');
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            if (id == 'continue') {
                this.nextItem();
            } else if (id == 'back') {
                this.prevItem();
            }

            vent.trigger('play_sfx', 'button_click');

        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        }


    });

});