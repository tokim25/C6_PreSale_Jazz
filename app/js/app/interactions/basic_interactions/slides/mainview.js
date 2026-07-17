/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Slides',

        ui: {
            //
            instrux: '.onscreen-instrux',
            content: '.content',
            slides: '.slide',
            slideContainer: '.slides-container',
            slideBlob: '.slide-blob',
            continueButton: '.continue-button',
            backButton: '.back-button',
            buttons: '.main-button',
            scrim: '.scrim-background'
        },

        currentSlide: null,
        $currentSlide: null,
        index: -1,
        LOG_LEVEL: 5,

        events: {
            'click @ui.buttons': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;

            this.currentSlide = null;
            this.$currentSlide = null;
            this.index = -1;
            this.items = this.model.get('items');
        },

        onRender: function() {

            this.ui.scrim.hide();

            this.ui.backButton.addClass('disabled');
            TweenMax.set(this.ui.slides, {autoAlpha: 0});

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');
            this.nextSlide();

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

        nextSlide: function () {
            this.index ++;

            if (this.index <= this.items.length - 1) {
                var slideObj = this.items[this.index];
                this.setSlide(slideObj);
            }

            if (this.index == this.items.length - 1) {
                if (this.stopOnLastElement) {
                    this.ui.continueButton.addClass('disabled');
                }
                this.trigger('slideview:last-slide');
            } else if (this.index == this.items.length) {
                this.index --;
                this.endInteraction();
            }

            if(this.index > 0) {
                this.ui.backButton.removeClass('disabled');
            }

        },

        prevSlide: function () {
            this.index --;

            if (this.index < 0) {
                this.index = 0;
            }
            if (this.index == 0) {
                this.ui.backButton.addClass('disabled');
            }

            this.ui.continueButton.removeClass('disabled');

            var slideObj = this.items[this.index];
            this.setSlide(slideObj);
        },

        setSlide: function (slideObj) {

            var tl = new TimelineMax(),
                $newSlide = this.$('.slide[data-id=slide-' + this.index + ']'),
                slidePath = _.find(this.model.get('assetManifest'), function (item){
                    return item.id == slideObj.src;
                }).src;

            switch (slideObj.type) {
                case 'img':
                    $newSlide.empty();
                    $newSlide.append('<img src="' + slidePath + '" />');
                    break;
                case 'img-blob':
                    $newSlide.empty();
                    $newSlide.append('<img src="' + slidePath + '" />');
                    $newSlide.append('<div class="slide-blob">' + slideObj.blob + '</div>');
                    break;
                case 'blob':
                    trace('ERROR: need to create "BLOB-TYPE" for slide content', this.LOG_LEVEL);
                    break;
            }
            if (this.$currentSlide) {
                tl.add(TweenMax.to(this.$currentSlide, 0.5, {autoAlpha: 0}));
            }
            tl.add(TweenMax.to($newSlide, 0.5, {autoAlpha: 1, onComplete: this.slideShown, onCompleteParams: [$newSlide], onCompleteScope: this}), '-=0.25');
        },

        slideShown: function ($newSlide) {
            this.$currentSlide = $newSlide;
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            if (id == 'continue') {
                this.nextSlide();
            } else if (id == 'back') {
                this.prevSlide();
            }

            vent.trigger('play_sfx', 'button_click');

        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        }


    });

});