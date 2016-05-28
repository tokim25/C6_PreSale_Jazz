/**
 * Created by jhoffsis on 9/21/15.
 */

define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        ui: {
            //
            textbox: '.reveal-text-box',
            itemsContainer: '.reveal-items-container',
            revealItems: '.reveal-item'
        },

        events: {
            'click @ui.revealItems': 'onRevealItemClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.completedItems = [];
            this.totalItems = this.model.get('items').length;
            this.completed = false;

        },

        onRender: function() {
            TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
            this.$win = $(window);
            this.$win.on('resize', $.proxy(this.onResize, this));

            setTimeout(function () {
                this.onResize();
            }.bind(this), 200);
        },

        onResize: function () {
            this.winHeight = Math.min(900, Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        },

        onShow: function () {
            trace("ON SHOW", 4);
        },

        onRevealItemClicked: function (e) {

            var $revealItem = $(e.currentTarget),
                index = parseInt($revealItem.attr('data-id')),
                item = this.model.get('items')[index],
                $content = this.ui.textbox.find('.content');

            this.updateCompleted(index);

            $('.reveal-item').removeClass('selected');
            $revealItem.addClass('selected');

            //TweenMax.set('.reveal-text-box', {autoAlpha: 1.0})

            TweenMax.set(this.ui.textbox, {autoAlpha: 0.0, left: '65%'});

            TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 1.0, left: '55%'});

            $content.html('<h1>' + item.header + '</h1>' + item.body);

            vent.trigger('play_sfx', 'revealitem-click');

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
            TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0});
        }


    });

});
