/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {
    return Marionette.ItemView.extend({

        name: 'Menu',

        ui: {
            //
            instrux: '.onscreen-instrux',
            interactionContainer: '.menu-interaction-container',
            itemsContainer: '.items-container',
            menuItems: '.menu-item',
            continueButton: '.continue-button',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.menuItems.enabled': 'onMenuItemClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.interactions = options.interactions;
            this.completedItems = [];
            this.totalItems = this.model.get('items').length;
            this.completed = false;

            this.$currentItem = null;
            this.interaction = null;
        },

        onRender: function() {

            this.ui.scrim.hide();


            TweenMax.staggerTo(this.ui.menuItems, 0.01, {delay: 0.75, className: '+=active'}, 0.3);
            this.ui.continueButton.removeClass('enabled').addClass('disabled');

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

            TweenMax.staggerTo(this.ui.menuItems, 0.01, {className: '+=enabled'}, 0.3);
            TweenMax.set(this.ui.instrux, {className: '+=active'});
        },

        onMenuItemClicked: function (e) {

            var $menuItem = $(e.currentTarget),
                index = parseInt($menuItem.attr('data-id')),
                intObj = this.model.get('items')[index];

            if (this.$currentItem) {
                this.$currentItem.removeClass('selected');
            }

            this.$currentItem = $menuItem;
            this.currentIndex = index;

            $menuItem.addClass('selected');


            vent.trigger('play_sfx', 'menuitem-click');

            //TODO: Add interactive video creation here

            var type = intObj.type,
                interaction = this.interactions[type],
                model = interaction.model != undefined ? new interaction.model(intObj) : new Backbone.Model(intObj),
                template = interaction.template,
                View = interaction.view;

            model.set('assetManifest', this.model.get('assetManifest'));

            this.interaction = new View({template: template, model:model, interactions: this.interactions, soundPlayer:this.soundPlayer});

            this.ui.interactionContainer.empty();
            this.ui.interactionContainer.append(this.interaction.render().el);

            this.listenTo(this.interaction, 'interaction:complete', this.onInteractionComplete);
            this.interaction.startInteraction();
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
                $button.addClass('enabled button-menu').removeClass('disabled');
                setTimeout(function () {
                    $button.removeClass('button-menu');
                }.bind(this), 1600)
            } else {
                $button.removeClass('enabled').addClass('disabled');
            }
        },

        onInteractionComplete: function () {
            this.update(this.currentIndex);
            this.$currentItem.addClass('completed');
            if (this.interaction) {

                this.stopListening(this.interaction, 'interaction:complete', this.onInteractionComplete);
                this.destroyOverlayInteraction();
            }
        },

        destroyOverlayInteraction: function () {
            this.ui.interactionContainer.empty();
            this.interaction = null;
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
            this.trigger('interaction:complete', this.model);
        }


    });

});