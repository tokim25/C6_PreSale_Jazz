/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/jukebox/mainview.html"],
    function (Marionette, vent, Popup, Splash, text, popuptext) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            feedbackContainer: '.feedback-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            scrim: '.scrim-background',
            continueButton: '.continue-button',
            jukeboxPlaying: '#jukebox-playing',
            jukeboxButtons: '.jukebox-button',
            textBox: '.jukebox-text-container',
            ring: '.jukebox-ring'
        },

        events : {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.jukeboxButtons': 'onJukeboxButtonClicked'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            this.soundPlayer = options.soundPlayer;

        },

        onRender: function() {
            var textObj = {
                'template': popuptext,
                'showTitle': true,
                'title': '',
                'body': '',
                'buttons': [{'id': 'continue', 'label': 'OK!'}],
                'containerClass': 'blob1-popup'
            }
            this.feedback = new Popup(textObj);
            this.listenTo(this.feedback, 'continue:clicked', this.checkAnswer);

            this.ui.feedbackContainer.append(this.feedback.render().el);

            var splashObj = {
                bg_info: this.model.get('bg_info'),
                name: this.model.get('name'),
                modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                template: 'splash',
                elements: this.model.get('text').splash.slice(),
                buttons: [{'id': 'continue', 'label': 'Next'}],
                containerClass: 'splash-popup'
            }
            this.splash = new Splash({model: new Backbone.Model(splashObj)});
            this.ui.splashContainer.append(this.splash.render().el);
            this.listenTo(this.splash, 'splash:complete', this.startInteraction);

            if (this.model.get('text').conclusion != undefined) {
                var conclObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'conclusion',
                    badge: this.model.get('menuModel').get('badge'),
                    elements: this.model.get('text').conclusion.slice(),
                    buttons: [{'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                };

                this.conclusion = new Splash({model: new Backbone.Model(conclObj)});
                this.ui.conclusionContainer.append(this.conclusion.render().el);
                this.listenToOnce(this.conclusion, 'splash:complete', this.endInteraction);
            }

            this.ui.scrim.hide();

            this.constructInteraction();

            this.$win = $(document);

            this.buttonEnable(this.ui.continueButton, false);

            TweenMax.set(this.feedback.$el.find('.popup-view'), {autoAlpha: 0.0});

            this.splash.show();
        },

        startInteraction: function () {
            this.splash.fadeOut();

            this.feedback.$el.show();

            this.trigger('mainview:activity-start');
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('id'),
                dataID = $button.attr('data-id');

            vent.trigger('play_sfx', 'button_click');

            this.showConclusion();
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

        onJukeboxButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                dataID = $button.attr('data-id'),
                item = this.model.items.get(dataID),
                audioID = item.get('audioID'),
                textObj = {
                    header: item.get('header'),
                    body: item.get('body')
                };

            this.model.updateChoice(dataID);

            this.ui.jukeboxButtons.removeClass('selected');
            $button.addClass('selected');

            this.showText(textObj);

            this.$selectedButton = $button;

            vent.trigger('play_sfx', 'radio_click');
            setTimeout(function () {
                //this.soundPlayer.playSound(audioID);
                this.$selectedButton.removeClass('selected').addClass('completed');
                this.stopAnimation();
                this.hideText();
                if (this.model.allComplete()) {
                    this.buttonEnable(this.ui.continueButton, true);
                }
            }.bind(this), 5000)
            //}.bind(this), 200)

            this.startAnimation();


        },

        showText: function (content, delay) {
            delay = delay || 0;

            this.ui.textBox.find('h4').html(content.header);
            //this.ui.textBox.find('p').html(content.body);



            //TODO: size the scrim to $win dimensions, or include onresize method
            //this.ui.scrim.fadeIn(300);
        },

        hideText: function (delay) {

            delay = delay || 0;

            //TweenMax.to(this.ui.jukeboxPlaying, 1.0, {delay: delay, top: '100%'});

        },

        startAnimation: function () {
            this.tl_anim.play(0);
        },

        stopAnimation: function () {
            //this.tl_anim.stop();
            TweenMax.to(this.ui.ring, 0.5, {autoAlpha: 0.0});
            TweenMax.to(this.ui.jukeboxPlaying, 0.5, {top: '100%', ease: Circ.easeIn})
        },

        onAnimComplete: function () {

        },

        constructInteraction: function () {
            this.tl_anim = new TimelineMax({
                paused: true,
                onComplete: this.onAnimComplete,
                onCompleteScope: this
            });
            this.beziers = [
                [{x:100, y:-100},{x:400, y:-250},{x:800, y:-150},{x:1225, y:-400}],
                [{x:75, y:-15},{x:315, y:95},{x:400, y:50},{x:625, y:-85},{x:785, y:10},{x:1050, y:150},{x:1225, y:90}],
                [{x:62, y:-50},{x:300, y:-60},{x:700, y:350},{x:1225, y:166}],
                [{x:100, y:-150},{x:400, y:-350},{x:800, y:-250},{x:1225, y:-550}],
                [{x:100, y:50},{x:400, y:-100},{x:600, y:200},{x:950, y:-150},{x:1225, y:-50}],
                [{x:75, y:15},{x:315, y:-95},{x:400, y:-50},{x:625, y:85},{x:785, y:-10},{x:1050, y:-150},{x:1225, y:-90}],
                [{x:62, y:-20},{x:300, y:20},{x:500, y:-150},{x:1225, y:156}],
                [{x:100, y:-150},{x:400, y:-350},{x:800, y:-250},{x:1225, y:-550}],
                [{x:100, y:-30},{x:400, y:100},{x:600, y:-200},{x:950, y:150},{x:1225, y:50}],
                [{x:100, y:50},{x:400, y:-100},{x:600, y:200},{x:950, y:-150},{x:1225, y:-50}],
            ];

            var startTime = 0.5,
                tweens = [
                    TweenMax.to(this.ui.jukeboxPlaying, 0.5, {top: '-5%', ease: Circ.easeOut})
                ];
            trace('bez: ', 5);
            _.each(this.ui.ring, function (ring, i) {
                var $ring = $(ring),
                    scale = 1.0 + Math.random()*1 - .5;

                tweens.push(TweenMax.to($ring, 2.5, {
                    delay: startTime,
                    bezier: {
                        type: 'thru',
                        values: this.beziers[i],
                        curviness: 1
                    },
                    startAt:{autoAlpha: 1.0},
                    scale: scale,
                    ease: Power1.easeOut
                }));

                startTime += 0.25;
            }.bind(this));

            this.tl_anim.add(tweens);

            TweenMax.set(this.ui.ring, {autoAlpha: 0.0});

            /*this.tl_anim.staggerTo(this.ui.ring, 2.5, {
                rotation: -10,
                bezier: {
                    type: 'thru',
                    values: this.bezier,
                    curviness: 1
                },
                startAt:{autoAlpha: 1.0},
                scale: 1.2,
                ease: Power1.easeInOut
            }, 0.15);*/
        },



        onDestroy: function () {
        }
    });

});