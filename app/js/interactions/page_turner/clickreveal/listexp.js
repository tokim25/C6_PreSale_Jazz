/**
 * Created by jhoffsis on 9/21/15.
 */

define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        ui: {
            //
            itemsContainer: '.reveal-items-container',
            revealItems: '.reveal-item'
        },
        
        events: {
            'click @ui.revealItems': 'onRevealItemClicked'
        },
        
        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.soundPlayer = options.soundPlayer;
            this.completedItems = [];
            this.totalItems = this.model.get('items').length;
            this.completed = false;
        },

        onRender: function() {
            this.$win = $(window);
            this.$win.on('resize', $.proxy(this.onResize, this));

            setTimeout(function () {
                this.onResize();
            }.bind(this), 200);
        },

        onResize: function () {
            this.winHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        },

        onShow: function () {
            trace("ON SHOW", 4);
        },

        onRevealItemClicked: function (e) {
            var $revealItem = $(e.currentTarget),
                index = parseInt($revealItem.attr('data-id')),
                item = this.model.get('items')[index],
                audioID = 'listexp_cta' + (index + 1)


            this.updateCompleted(index);

            vent.trigger('play_sfx', 'shoelace');

            this.soundPlayer.playSound(audioID);

            $('.reveal-item').removeClass('selected');
            $revealItem.addClass('selected');


        },

        updateCompleted: function (index) {
            if (this.completedItems.indexOf(index) <0) {
                this.completedItems.push(index);
            }

            if(this.completedItems.length == this.totalItems) {
                this.setCompleted(true);
            }
        },

        isComplete: function () {
            return this.completed;
        },

        setCompleted: function (bool) {
            this.completed = bool;
        },

        sceneComplete: function () {
            this.soundPlayer.killCurrentSound();
            //TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
        }


    });

});
