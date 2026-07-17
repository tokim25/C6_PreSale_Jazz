/**
 * Created by jhoffsis on 10/23/15.
 */


define([
        "marionette",
        "app/vent",
        "app/utils/animation",
        "ui/popup",
        "text!templates/app/bookends/introview.html",
        "text!templates/ui/popup.html",
        "text!templates/splashscreens/splash.html"
    ],

    function (Marionette, vent, Animation, Popup, text, popuptext, splashtext) {

        return Marionette.ItemView.extend({

            template : text,

            ui: {
                //
                introContainer: '.intro-container',
                elementsContainer: '.intro-elements',
                rolechooserContainer: '.intro-rolechooser-container',
                inputName: '#intro-user-name',
                inputRole: '#intro-user-role',
                continueButton: '.main-button.continue-button'
            },

            events : {
                'click @ui.continueButton': 'onButtonClicked'
            },

            initialize: function (options) {
                trace('mainview: initialize()');
                this.soundPlayer = options.app.soundPlayer;
                this.model = options.model;
                this.tl_enter = null;
                this.tl_leave = null;
                this.tweenList = [];

            },

            onRender: function() {


                this.constructInteraction();


                //this.ui.continueButton.removeClass('enabled').addClass('disabled')

            },


            introComplete: function () {
                vent.trigger('intro:intro-complete');
            },

            show: function () {
                this.render();
                this.ui.introContainer.fadeIn();
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
                            this.introComplete();
                        }.bind(this), 3000);
                    }

                    //this.introComplete();
                }

            },

            commitSelections: function () {
                var name = this.ui.inputName.val(),
                    role = this.ui.inputRole.val();

                vent.trigger('intro:commit-inputs', {name: name, role: role});


            },

            constructInteraction: function () {
                var elements = this.model.get('elements'), $el;

                this.ui.elementsContainer.css('opacity', 0);

                _.each(elements, function (element, i) {
                    $el = $(element.el);
                    $el.attr('id', element.id);
                    $el.attr('class', element.class != undefined ? 'intro-element ' + element.class : 'intro-element');
                    TweenMax.set($el, element.props);

                    //TODO: fix this hack!
                    if(element.prepareLine != undefined) {
                        TweenMax.to($el.find(element.prepareLine), 0, {drawSVG: 0});
                    }

                    this.ui.elementsContainer.append($el);

                }.bind(this));

                var enterTweens = this.model.get('enter'),
                    leaveTweens = this.model.get('leave');

                this.splits = [];

                setTimeout(function () {
                    if (enterTweens != undefined) {
                        this.tl_enter = new TimelineMax({
                            onComplete: this.onEnterComplete,
                            onCompleteScope: this
                        });

                        Animation.buildTimeline(this, this.tl_enter, enterTweens, this.splits);

                    }

                    if (leaveTweens != undefined) {
                        // create leave timeline
                        this.tl_leave = new TimelineMax({
                            paused: true,
                            onComplete: this.onLeaveComplete,
                            onCompleteScope: this
                        });
                        Animation.buildTimeline(this, this.tl_leave, leaveTweens, this.splits);

                    }
                }.bind(this), 0);
                TweenMax.to(this.ui.elementsContainer, 0.5, {opacity: 1});

            },


            playLoop: function () {
                this.tweenList.push(TweenMax.to(this.$('#img-intro-record-disc'), 4, {rotation:'360deg', ease:Linear.easeNone, repeat:-1}))
                this.soundPlayer.playSFX('record_scratch');
                setTimeout(function () {
                    this.soundPlayer.playLoop('loop_intro');
                }.bind(this), 3000)

                trace("PLAY LOOP", 4);
            },

            playCDLoop: function () {
                this.tweenList.push(TweenMax.to(this.$('#img-intro-record-disc'), 1.8, {rotation:'360deg', ease:Linear.easeNone, repeat:-1}))
                this.soundPlayer.playSFX('cd_scratch');
                setTimeout(function () {
                    this.soundPlayer.playLoop('loop_intro');
                }.bind(this), 2000)

                trace("PLAY CD LOOP", 4);
            },

            onEnterComplete: function () {
                trace('onEnterComplete', 4);
                for(var i=0; i<this.splits.length; i++) {
                    this.splits[i].revert();
                }
            },

            onLeaveComplete: function () {
                this.introComplete();
            },

            onDestroy: function () {
                this.tl_enter.kill();
                this.tl_leave.kill();
                for (var i = 0; i<this.tweenList.length; i++) {
                    this.tweenList[i].kill();
                }

            }
        });

    });/**
 * Created by jhoffsis on 3/21/17.
 */
