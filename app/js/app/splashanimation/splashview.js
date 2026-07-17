/**
 * Created by jhoffsis on 10/23/15.
 */


define([
        "marionette",
        "app/vent",
        "text!templates/app/splashanimation/splashview.html"
    ],

    function (Marionette, vent, text) {

    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            splashContainer: '#splash-view',
            splashTitle: '.splash-title',
            logoGroup: '.splash-logo-group',
            splashLogo: '.splash-logo',
            roteLogo: '.splash-rote-logo',
            pandoraLogo: '.splash-pandora-logo',
            logoText: '.splash-logo-text'
        },

        events : {

        },

        initialize: function (options) {
            trace('mainview: initialize()');
            this.soundPlayer = options.app.soundPlayer;
            this.tl_enter = null;
            this.tl_leave = null;
        },

        onRender: function() {

            this.constructInteraction();
        },


        splashComplete: function () {
            vent.trigger('splash:splash-complete');
        },

        show: function () {
            this.render();
            this.ui.splashContainer.fadeIn();
        },


        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            if(dataID === "continue") {

                this.commitSelections();

                if (this.tl_leave) {
                    this.tl_leave.play();
                } else {
                    setTimeout(function () {
                        //do some animation shit and fade stuff out
                        this.splashComplete();
                    }.bind(this), 3000);
                }

                //this.splashComplete();
            }

        },

        constructInteraction: function () {

            this.tl_enter = new TimelineMax({
                onComplete: this.splashComplete,
                onCompleteScope: this
            });

            this.tl_enter.add(TweenMax.from(this.ui.splashLogo, 0.75, {"marginLeft": "-1000px", "rotation": "-=720", ease:Back.easeOut}), "+=0.5")
                .add(TweenMax.to(this.ui.logoText, 1.0, {autoAlpha: 1}))
                .add(TweenMax.to(this.ui.splashTitle, 1.0, {autoAlpha: 1}), "+=0.5")
                .add([
                    TweenMax.to(this.ui.roteLogo, 1.0, {autoAlpha: 0}),
                    TweenMax.to(this.ui.pandoraLogo, 1.0, {autoAlpha: 0}),
                    TweenMax.to(this.ui.logoGroup, 1.0, {autoAlpha: 0}),
                    TweenMax.to(this.ui.splashTitle, 2.0, {autoAlpha: 0})
                ], "+=3");


            TweenMax.set(this.ui.logoText, {autoAlpha: 0});
            TweenMax.set(this.ui.splashTitle, {autoAlpha: 0});

        },

        onDestroy: function () {
            this.tl_enter.kill();
        }
    });

});