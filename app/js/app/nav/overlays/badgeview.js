/**
 * Created by jhoffsis on 10/21/15.
 */


define( ["marionette", "backbone", "text!templates/app/nav/overlays/badgeview.html", "../../vent"], function (Marionette, BackBone, text, vent) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            badges: '.badge',
            closeButton: '.close-button',
            badgeBox: '.badge-box'
        },

        events : {
            'click @ui.closeButton': 'onCloseClicked'
        },

        initialize: function (options) {
            trace('badgeview: initialize()');
            this.app = options.app;
            this.initCollection();

            //this.listenTo(vent, 'trackingmodel:sync-read', this.onTrackingModelSyncRead);
            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);
        },

        onRender: function() {
            trace('badgeview: onRender()');
            var $badge, badge, status;

            this.ui.badgeBox.addClass(this.app.model.get('role'));
            setTimeout(function () {
                this.badgeCollection.each(function (module) {
                    badge = module.get('badge').id;
                    status = module.get('status');
                    $badge = this.$('#' + badge);
                    if(status < 2) {
                        TweenMax.set($badge.find('.badge'), {autoAlpha: 0.0, scale: 0.5});
                        TweenMax.set($badge.find('.badge-banner'), {autoAlpha: 0.0});
                    } else {
                        TweenMax.set($badge.find('.badge-ghost'), {autoAlpha: 0.0});
                    }
                }.bind(this));
            }.bind(this), 1000);
        },

        onAppModelReset: function () {
            this.initCollection();
            this.render();
        },

        initCollection: function () {
            this.badgeCollection = new Backbone.Collection();

            var badges = [];

            this.app.model.moduleCollection.each(function (module) {
                if(module.get('badge') != undefined) {
                    this.badgeCollection.add(module);
                    badges.push(module);
                }
            }.bind(this));

            this.model = new BackBone.Model({badges: badges});
        },

        showBadge: function (badge) {
            var $badge = this.$('#' + badge.id);
            var $ghost = $badge.find('.badge-ghost');
            TweenMax.to($badge.find('.badge-ghost'), 0.5, {autoAlpha: 0.0});
            TweenMax.to($badge.find('.badge-banner'), 0.5, {autoAlpha: 1.0});
            TweenMax.to($badge.find('.badge'), 0.5, {delay: 1.0, autoAlpha: 1.0, scale: 1.0, ease:Back.easeOut});
        },

        onCloseClicked: function () {
            this.trigger('close:clicked')
        }
    });

});