/**
 * Rewritten to match this course family's static introview.html template
 * (#intro-view / .intro-banner / .intro-academy-group / #intro-rolechooser-container /
 * #intro-continue-button), instead of the newer data-driven tween-timeline template
 * that the upstream framework's version of this file expects.
 *
 * The banner, academy logo, maximize-window message, and role chooser are all
 * CSS-centered on the exact same point (top:50%/left:50%), so they're sequenced
 * one at a time via setTimeout + jQuery fade rather than shown simultaneously.
 */

define([
        "marionette",
        "app/vent",
        "text!templates/app/bookends/introview.html"
    ],

    function (Marionette, vent, text) {

    return Marionette.ItemView.extend({

        template : text,

        ui: {
            banner: '.intro-banner-container',
            academyGroup: '.intro-academy-group',
            maximizeMsg: '.intro-maximize-window',
            rolechooserContainer: '#intro-rolechooser-container',
            inputRole: '#intro-user-role',
            continueButton: '#intro-continue-button'
        },

        events : {
            'click @ui.continueButton': 'onButtonClicked',
            'change @ui.inputRole': 'onRoleChanged'
        },

        initialize: function (options) {
            trace('introview: initialize()');
            this.soundPlayer = options.app.soundPlayer;
            this.model = options.model;
            this.timers = [];
        },

        onRender: function() {
            this.ui.academyGroup.hide();
            this.ui.maximizeMsg.hide();
            this.ui.rolechooserContainer.hide();
            this.ui.continueButton.css('opacity', 0);

            this.ui.banner.show();

            this.timers.push(setTimeout(this.showAcademy.bind(this), 2500));
        },

        showAcademy: function () {
            this.ui.banner.fadeOut(400);
            this.ui.academyGroup.fadeIn(400);
            this.timers.push(setTimeout(this.showMaximizeMsg.bind(this), 2200));
        },

        showMaximizeMsg: function () {
            this.ui.academyGroup.fadeOut(400);
            this.ui.maximizeMsg.fadeIn(400);
            this.timers.push(setTimeout(this.showRoleChooser.bind(this), 2200));
        },

        showRoleChooser: function () {
            this.ui.maximizeMsg.fadeOut(400);
            this.ui.rolechooserContainer.fadeIn(400);
            this.ui.continueButton.css('opacity', 1);
        },

        introComplete: function () {
            vent.trigger('intro:intro-complete');
        },

        show: function () {
            this.render();
        },

        onRoleChanged: function () {
            var role = this.ui.inputRole.val();
            this.ui.continueButton.css('opacity', role ? 1 : 0.3);
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                dataID = $button.attr('data-id'),
                role = this.ui.inputRole.val();

            if (dataID === "continue") {
                if (!role) {
                    return;
                }
                this.commitSelections();
                this.introComplete();
            }
        },

        commitSelections: function () {
            var role = this.ui.inputRole.val();
            vent.trigger('intro:commit-inputs', {name: '', role: role});
        },

        onDestroy: function () {
            for (var i = 0; i < this.timers.length; i++) {
                clearTimeout(this.timers[i]);
            }
        }
    });

});
