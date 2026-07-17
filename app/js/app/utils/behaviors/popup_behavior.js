/**
 * Created by jhoffsis on 8/10/15.
 */


define(['backbone', 'marionette'], function (Backbone, Marionette) {
    var Popup = Marionette.Behavior.extend({

        defaults: {

            title: 'This is the title',
            body: 'This is the body of the message!',
            buttons: [],
            containerClass: 'generic-popup',
            showTitle: false,
            multipleScreens: false
        },

        ui: {
            title: '.popup-title',
            body: '.popup-body',
            container: '.popup-view',
            buttons: '.popup-button',
            closeButton: '.close-x-button'
        },

        events: {
            'click @ui.buttons': 'onButtonClick',
            'click @ui.closeButton': 'onButtonClick'
        },

        initialize: function() {
            trace('popup-behavior: init()', 1)
        },

        onRender: function() {

            var $button, id, label,
                key, val;


            _.each(_.pairs(this.view.options), function (pair, i) {
                key = pair[0];
                val = pair[1];
                this[key] = val;
            }.bind(this));

            if ($.isArray(this.body)) {
                this.body = this.body.slice(0);
                this.multipleScreens = true;
            }

            _.each(this.buttons, function (button, i) {
                id = button.id, label = button.label,
                    bclass = id != 'close' ? 'popup-button' : 'close-x-button';
                $button = $('<div data-id="' + id + '" class="' + bclass + '">' + label + '</div>');
                this.ui.container.append($button);
            }.bind(this));

            if (this.showTitle && this.ui.title != undefined && this.title != '') {
                this.ui.title.html(this.title);
            }

            if (this.ui.body != undefined && this.body != '') {
                if (!this.multipleScreens) {
                    this.ui.body.html(this.body);
                } else {
                    this.ui.body.html(this.body.shift());
                    if (this.body.length < 1) {
                        this.view.triggerMethod('lastScreen')
                    }
                }

            }

            this.ui.container.addClass(this.containerClass);

            this.$el.hide();

        },

        onButtonClick: function (e) {
            var id = $(e.currentTarget).attr('data-id');

            this.view.triggerMethod(id + ':clicked');

            if(id === 'close') {
                this.$el.hide();
            }
        },

        onBeforeDestroy: function() {

        }
    });

    return Popup;

})