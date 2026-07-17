/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Picture Show',

        ui: {
            //
            instrux: '.onscreen-instrux',
            content: '.content',
            pictures: '.picture',
            pictureContainer: '.picture-container',
            continueButton: '.continue-button',
            backButton: '.back-button',
            buttons: '.main-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.buttons': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;

            this.index = -1;
            this.items = this.model.get('items');
            this.interval = null;
        },

        onRender: function() {

            this.ui.scrim.hide();

            this.ui.backButton.addClass('disabled');
            TweenMax.set(this.ui.pictures, {autoAlpha: 0});
            this.buttonEnable(this.ui.continueButton, false);

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');
            setTimeout(function () {
                this.nextPicture();
            }.bind(this), 1500);

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

        nextPicture: function () {
            this.index ++;



            if (this.index <= this.items.length - 1) {
                var pictureObj = this.items[this.index];
                this.setPicture(pictureObj);
            }
            if (this.index == 0 && this.index < this.items.length - 1) {
                this.interval = setInterval(function () {
                    this.nextPicture();
                }.bind(this), this.model.get("interval"));
            } else if (this.index == this.items.length - 1) {
                clearInterval(this.interval);
                this.buttonEnable(this.ui.continueButton, true);
                this.trigger('pictureview:last-picture');
            } else if (this.index == this.items.length) {
                this.index --;
                clearInterval(this.interval);
                this.endInteraction();
            }

            if(this.index > 0) {
                //this.ui.backButton.removeClass('disabled');
            }

        },

        prevPicture: function () {
            this.index --;

            if (this.index < 0) {
                this.index = 0;
            }
            if (this.index == 0) {
                //this.ui.backButton.addClass('disabled');
            }

            this.ui.continueButton.removeClass('disabled');

            var pictureObj = this.items[this.index];
            this.setPicture(pictureObj);
        },

        setPicture: function (pictureObj) {

            var $newPicture = this.$('.picture[data-id=picture-' + this.index + ']'),
                animation = pictureObj.animation,
                picturePath = _.find(this.model.get('assetManifest'), function (item){
                    return item.id == pictureObj.src;
                }).src;

            switch (pictureObj.type) {
                case 'img':
                    $newPicture.empty();
                    $newPicture.append('<img src="' + picturePath + '" />');
                    break;
                case 'img-blob':
                    $newPicture.empty();
                    $newPicture.append('<img src="' + picturePath + '" />');
                    $newPicture.append('<div class="picture-blob">' + pictureObj.blob + '</div>');
                    break;
                case 'blob':
                    trace('ERROR: need to create "BLOB-TYPE" for picture content', this.LOG_LEVEL);
                    break;
            }

            switch (animation) {
                case "rotateIn":
                    TweenMax.set($newPicture, {autoAlpha: 1});
                    TweenMax.from($newPicture, 1, {rotation: '-=500deg', scale: 0.2, ease: Expo.easeOut});
                    break;
                case "spinIn":
                    TweenMax.set($newPicture, {autoAlpha: 1});
                    TweenMax.from($newPicture, 1, {rotation: '-=700deg', scale: 0.2, top: '25%', left: '25%', ease: Expo.easeOut});
                    break;
                default:
                    TweenMax.to($newPicture, 0.5, {autoAlpha: 1});

            }

        },

        pictureShown: function ($newPicture) {
            this.$currentPic = $newPicture;
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
                id = $button.attr('data-id');

            if (id == 'continue') {
                this.endInteraction();
            } else if (id == 'back') {
                this.prevPicture();
            }

            vent.trigger('play_sfx', 'button_click');

        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        },

        onDestroy: function () {
            clearInterval(this.interval);
        }


    });

});