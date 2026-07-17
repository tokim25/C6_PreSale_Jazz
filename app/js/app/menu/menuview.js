/**
 * Created by jhoffsis on 7/27/15.
 */

define( ["marionette", "text!templates/app/menu/menuview-dev.html", "app/vent"], function (Marionette, text, vent) {
    return Marionette.ItemView.extend({

        template : text,



        ui: {
            mainView: '#menu-view',
            menuButton: '.menu-button'
        },

        events : {
            'click @ui.menuButton': 'onButtonClicked'
        },

        initialize: function (options) {
            trace('menuview: initialize()', 1);
            this.model = options.model;
            this.app = options.app;
            this.listenTo(this.model, 'lockingmode:updated', this.onLockingModeUpdated);

            this.listenTo(this.model, 'model:update', this.onModelUpdated);

        },

        serializeData: function () {
            return _.extend({}, this.model.toJSON(), {app: this.app});
        },

        onRender: function() {
            trace('menuview: onRender()', 1);

            this.constructInteraction();

            this.onModelUpdated();

            TweenMax.set(this.$el, {autoAlpha: 0.0});
            TweenMax.to(this.$el, 0.5, {delay: 0.3, autoAlpha: 1.0});

        },

        show: function () {
           // this.$win.scrollTop(this.scrollPosition);
            this.$('#menu-view').scrollTop(this.scrollPosition);
            //this.controller.update(true);
        },

        /**
         * MENU FUNCTIONALITY
         */


        onModelUpdated: function () {
            this.updateStatus();
            this.updateLocking();
        },

        updateStatus: function () {
            this.model.moduleCollection.each(function (module) {
                this.updateButtonStatus(module);
            }.bind(this));
        },

        updateButtonStatus: function (item) {
            var status = item.get('status'),
                id = item.get('moduleName'),
                $button = this.$('#menu-button-' + id),
                newClass = '';

            switch(status) {
                case 0:
                    newClass = 'not-started';
                    break;
                case 1:
                    newClass = 'started';
                    break;
                case 2:
                    newClass = 'completed';
                    break;
            }

            $button.removeClass('not-started started').addClass(newClass);
        },

        onLockingModeUpdated: function () {
            this.render();
        },

        updateLocking: function () {

            var id, $button;

            this.model.moduleCollection.each(function (module) {

                id = module.get('moduleName');
                $button = this.$('#menu-button-' + id);

                if (module.get('locked')) {
                    $button.addClass('locked');
                } else {
                    $button.removeClass('locked');
                }
            }.bind(this));
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget);
            var id = $button.attr('data-id');

            this.scrollPosition = this.$('#menu-view').scrollTop();

            this.model.set('currentSelection', id);
            this.trigger('menuview:item-selected');
            vent.trigger('play_sfx', 'button_click');
        },

        /**
         * LAYOUT FUNCTIONALITY
         */

        constructInteraction: function () {
            this.$win = $(document);

        }
    });

});