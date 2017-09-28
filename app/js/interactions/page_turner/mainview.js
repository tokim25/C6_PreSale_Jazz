/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette", "app/vent", "text!templates/interactions/page_turner/mainview.html", "ui/pageturner_textbox"], function (Marionette, vent, text, TextBox) {
    return Marionette.ItemView.extend({

        template: text,

        ui: {
            //
            container: '#pt-container',
            contentContainer: '#pt-content-container',
            mainView: '#pt-main-view',
            colorOverlay: '#pt-color-overlay',
            progressButton: '.pt-progress-button',
            nextButton: '#pt-progress-next-button',
            prevButton: '#pt-progress-prev-button',
            continueButton: '.continue-button',
            scrollBox: '.pt-scroll',
            revealItems: '.reveal-item'
        },

        events: {
            'click @ui.progressButton.enabled.groupEnabled': 'onProgressClicked',
            'click @ui.revealItems': 'onRevealItemClicked',
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.nextButton': 'onNextButtonClicked',
            'click @ui.prevButton': 'onPrevButtonClicked'
        },

        index: 0,
        scene_ar: [],
        tweens: {},
        tweenList: [],
        currentInteraction: null,
        tweenOffset: 0,
        scrollTop: 0,
        minScroll: 10,
        scrollDirection: 1,
        scrollEnabled: false,
        $textBox: null,
        textCallbackEnabled: false,
        $win: null,
        $body: null,
        lastScrollTop: 0,

        initialize: function (options) {
            this.model = options.model;
            this.interactions = options.interactions;
            this.soundPlayer = options.soundPlayer;
            this.chapter = options.chapter;
            this.tweens= {};
            this.scrollTop = 0;
            this.index = 0;
            this.tweenOffset = .5;
            this.scrollDirection = 1;
            this.scrollEnabled = false;
            this.loopPlaying = true;
            this.intervalID;
        },

        onRender: function () {
            trace('Pageturner: onRender()', 0);

            this.scene_ar = _.pluck(this.model.get('scenes'), 'id');

            this.$el.hide();

            this.constructPage();

            this.$win = $(window);
            this.$body = $('body');
            this.$body.css('overflow', 'visible');
            this.$win.on('resize', $.proxy(this.onResize, this));
            if(this.scene_ar.length == 1) {
                this.$('.pt-progress-container').hide();
            }
            this.ui.continueButton.hide();

        },

        constructPage: function () {
            var elements = this.model.get('elements'), $el,
                scenes = this.model.get('scenes'),
                tl_enter, tl_leave, tween_props, tween, label, i, tlDuration, infiniteRepeat = false;

            //this.ui.mainView.hide();
            this.$textBox = new TextBox({completeCallback: this.onTextTweenComplete, callbackScope: this});
            this.ui.contentContainer.append(this.$textBox.render().el);


            _.each(elements, function (element, i) {
                $el = $(element.el);
                $el.attr('id', element.id);
                $el.attr('class', 'pt-element ' +element.class);
                TweenMax.set($el, element.props);

                //TODO: fix this hack!
                if(element.prepareLine != undefined) {
                    TweenMax.to($el.find(element.prepareLine), 0, {drawSVG: 0});
                }

                this.ui.contentContainer.append($el);

            }.bind(this));

            _.each(scenes, function (scene, i) {
                if(scene.interaction != undefined) {
                    var name = scene.interaction.name,
                        template = this.interactions[name].template,
                        model = new Backbone.Model(scene.interaction),
                        Module = this.interactions[name].module,
                        selector = this.$('#' + scene.interaction.id),
                        interaction;

                    interaction = new Module({template: template, model:model, soundPlayer:this.soundPlayer});

                    this.interactions[name].interaction = interaction;

                    this.listenTo(interaction, 'reveal-item:clicked', this.onRevealItemClicked);

                    selector.append(interaction.render().el);
                }

            }.bind(this));

            setTimeout(function () {

                _.each(scenes, function (scene) {
                    this.tweens[scene.id] = {'complete':false};

                    if (scene.enter != undefined) {
                        tlDuration = 0;
                        infiniteRepeat = false;
                        label = scene.id + '_enter';

                        tl_enter = new TimelineMax({
                            paused: true,
                            onComplete: this.onEnterComplete,
                            onCompleteParams: ['enterComplete...'+label],
                            onCompleteScope: this,
                            onReverseComplete: this.onLeaveComplete,
                            onReverseCompleteParams: ['reverseLeaveComplete...'+label],
                            onReverseCompleteScope: this
                        });

                        for (i = 0; i < scene.enter.length; i++) {
                            tween_props = scene.enter[i];
                            tween_props.ease = tween_props.ease != undefined ? EaseLookup.find(tween_props.ease) : Power2.easeIn;
                            tween_props.duration = tween_props.duration != undefined ? tween_props.duration : 0.3;
                            if(tween_props.staggerOffset == undefined){
                                tween = TweenMax[tween_props.type]('#' + tween_props.id, tween_props.duration, tween_props.props);
                            } else {
                                tween = TweenMax[tween_props.type]('#' + tween_props.id, tween_props.duration, tween_props.props, tween_props.staggerOffset);
                            }

                            tl_enter.add(tween, tween_props.startTime + this.tweenOffset)

                            tlDuration = tlDuration + tween_props.duration;
                            if(tween_props.props.repeat != undefined && tween_props.props.repeat > 1) {
                                infiniteRepeat = true;
                            }
                        }

                        if(infiniteRepeat) {
                            trace("tlDuration: "+tlDuration, 2)
                            tl_enter.onComplete = null;
                            tl_enter.addCallback(this.onEnterComplete, tlDuration, ['enterCompleteTIMED...'+label], this)
                        }

                        if (tl_enter.totalDuration() > 0) {
                            this.tweens[scene.id]['enter'] = tl_enter;
                            this.tweenList.push(tl_enter);
                        }
                    }

                    if (scene.leave != undefined) {
                        infiniteRepeat = false;
                        tlDuration = 0;
                        label = scene.id + '_leave';
                        // create leave timeline
                        tl_leave = new TimelineMax({
                            paused: true,
                            onComplete: this.onLeaveComplete,
                            onCompleteParams: ['leaveComplete...'+label],
                            onCompleteScope: this,
                            onReverseComplete: this.onEnterComplete,
                            onReverseCompleteParams: ['reverseEnterComplete...'+label],
                            onReverseCompleteScope: this
                        });
                        for (i = 0; i < scene.leave.length; i++) {
                            tween_props = scene.leave[i];
                            tween_props.ease = tween_props.ease != undefined ? EaseLookup.find(tween_props.ease) : Power2.easeIn;
                            tween_props.duration = tween_props.duration != undefined ? tween_props.duration : 0.3;
                            if(tween_props.staggerOffset == undefined){
                                tween = TweenMax[tween_props.type]('#' + tween_props.id, tween_props.duration, tween_props.props);
                            } else {
                                tween = TweenMax[tween_props.type]('#' + tween_props.id, tween_props.duration, tween_props.props, tween_props.staggerOffset);
                            }
                            tl_leave.add(tween, tween_props.startTime);

                            tlDuration += tween_props.duration;
                            if(tween_props.props.repeat != undefined && tween_props.props.repeat > 1) {
                                infiniteRepeat = true;
                            }
                        }

                        if(infiniteRepeat) {
                            tl_leave.onComplete = null;
                            tl_leave.addCallback(this.onLeaveComplete, tlDuration, ['leaveCompleteTIMED...'+label], this)
                        }
                        if(tl_leave.totalDuration() > 0) {
                            this.tweens[scene.id]['leave'] = tl_leave;
                            this.tweenList.push(tl_leave);
                        }
                    }



                }.bind(this));

                var winHt = this.$win.height();
                var sHt = winHt * (scenes.length + 1);
                this.ui.scrollBox.height(sHt + winHt);

                this.ui.contentContainer.append(this.ui.continueButton);

                var startPage = 0;
                if (this.chapter != undefined && this.chapter != null) {
                    startPage = this.chapter;
                }
                this.$el.fadeIn(200, function () {
                    this.startInteraction(startPage);
                }.bind(this))

            }.bind(this), 100);
        },

        startInteraction: function (n) {
            this.index = n;
            this.scrollDirection = 1;
            this.scrollEnabled = false;
            this.renderScene('enter');

            if(this.scene_ar.length == 1) {
                this.buttonEnable(this.ui.continueButton, true);
            }

            this.lastScrollTop = 0;
            this.ui.prevButton.addClass('disabled');

            //this is so app will fade background loop after 5 seconds
            this.intervalID = setInterval(function () {
                clearInterval(this.intervalID);
                this.loopPlaying = false;
                this.trigger('mainview:activity-start');
            }.bind(this), 5000);
        },


        detectDirection: function () {

            var st = window.pageYOffset,
                direction, scrollDistance;

            scrollDistance = Math.abs(st - this.lastScrollTop);

            trace('scrollDistance: '+ scrollDistance, 5);

            if(scrollDistance < this.minScroll) {
                return 0;
            }


            if (st > this.lastScrollTop) {
                direction = 1;
            } else {
                direction = -1;
            }

            this.lastScrollTop = st;

            return direction;

        },

        onResize: function () {
            var yPos = this.$win.height()*this.index * -1;

            this.ui.scrollBox.css({'top': yPos});
        },

        enableScroll: function () {
            if(!this.scrollEnabled) {
                this.scrollEnabled = true;
                this.$win.on('scroll', $.proxy(this.bodyScroll, this));


                var yPos = this.$win.height()*this.index * -1
                this.ui.scrollBox.css({'top': yPos});

                this.$body.css('overflow', 'visible');

                try {
                    this.ui.progressButton.addClass('groupEnabled');
                } catch (e) {
                    this.$(this.ui.progressButton).addClass('groupEnabled');
                }

                this.updateNextPrev(true);
                trace("enableScroll", 2);
            }
        },

        disableScroll: function () {
            if(this.scrollEnabled) {
                this.scrollEnabled = false;
                this.$win.off('scroll', $.proxy(this.bodyScroll, this));

                this.$body.css('overflow', 'hidden');

                try {
                    this.ui.progressButton.removeClass('groupEnabled');
                } catch (e) {
                    this.$(this.ui.progressButton).removeClass('groupEnabled');
                }

                this.updateNextPrev(false);
                trace("disableScroll", 2);
            }

        },

        renderScene: function (mode) {

            var scene_str = this.scene_ar[this.index], label = '', tweenObj = this.tweens[scene_str],
                scene = this.model.get('scenes')[this.index],
                bgColor = scene.bg_color,
                textClass = scene.text.class || 'align-left',
                css = scene.text.css || null;

            TweenMax.to(this.ui.colorOverlay, 0.5, {delay: 0.2, backgroundColor: bgColor, ease:Linear.easeNone})

            if(mode === 'enter') {

                try {
                    this.ui.progressButton.removeClass('active').addClass('enabled');
                } catch (e) {
                    this.$(this.ui.progressButton).removeClass('active').addClass('enabled');
                }
                this.$('#progress' + this.index).addClass('completed active').removeClass('enabled');

                //ENTER INTO NEW SCREEN

                this.$textBox.setText(scene.text);
                this.$textBox.setClass(textClass);

                if (this.scrollDirection > 0 ) {
                    //If scrolling DOWN...
                    this.$textBox.tl.play('enter_down');

                    if(tweenObj['enter'] != undefined) {
                        tweenObj['enter'].restart();
                        trace('enter_down_normal', 4)
                    } else {
                        this.textCallbackEnabled = true;
                    }

                } else {
                    //If scrolling UP...
                    this.$textBox.tl.play('enter_up');

                    if(scene.enter_up != undefined && scene.enter_up == 'reverse') {
                        //if(scene.enter_up != undefined && scene.enter_up == 'enter' || !tweenObj.complete) {
                        if(tweenObj['leave'] != undefined) {
                            trace('enter_up_reverse (reverse leave tween)', 4)
                            tweenObj['leave'].reverse(tweenObj['leave'].duration());
                        }

                    } else if(scene.enter != undefined) {
                        trace('enter_up_normal (restart enter tween)', 4)
                        trace(TweenMax.getTweensOf(tweenObj["enter"]), 4)
                        tweenObj['enter'].restart();
                    } else {
                        this.textCallbackEnabled = true;

                    }


                }
            } else {

                //LEAVING CURRENT SCREEN

                if(tweenObj.enter != undefined && tweenObj.enter.isActive()) {
                    tweenObj.enter.stop();
                    trace('Killed the bugger!', 4)
                }

                if (this.scrollDirection > 0 ) {
                    //If scrolling DOWN...
                    this.$textBox.tl.play('leave_down');

                    if(tweenObj['leave'] != undefined) {
                        tweenObj['leave'].restart();
                        trace('leave_down_normal', 4)
                    } else {
                        this.textCallbackEnabled = true;
                    }

                } else {
                    //If scrolling UP...
                    this.$textBox.tl.play('leave_up');


                    if(scene.leave_up != undefined && scene.leave_up == 'reverse') {
                        if(tweenObj['enter'] != undefined) {
                            trace('leave_up_reversed (reverse enter tween)', 4)
                            tweenObj['enter'].reverse(tweenObj['enter'].duration());
                        }

                    } else if(scene.leave != undefined) {
                        trace('leave_up_normal (restart leave tween)', 4)
                        tweenObj['leave'].restart();
                    } else {
                        this.textCallbackEnabled = true;

                    }


                }
            }

            return;

        },

        onTextTweenComplete: function (context) {
            trace('onTextTweenComplete: ' + context, 2);

            if(!this.textCallbackEnabled) {
                return;
            }

            this.textCallbackEnabled = false;
            trace("Funky Going On", 4)
            if(context === 'enter_down' || context === 'enter_up') {
                this.onEnterComplete();
            } else {
                this.onLeaveComplete();
            }
        },

        onEnterComplete: function (context) {
            trace("ON ENTER COMPLETE -> " + context, 2);

            var scene_str = this.scene_ar[this.index],
                label = '',
                tweenObj = this.tweens[scene_str],
                scene = this.model.get('scenes')[this.index];

            tweenObj.complete = true;

            if (scene.interaction == undefined) {
                TweenMax.delayedCall(0.5, this.enableScroll, [], this)
            } else {
                var name = scene.interaction.name;

                this.currentInteraction = this.interactions[name].interaction;
                if (this.currentInteraction.isComplete()) {
                    this.enableScroll();
                } else {
                    TweenMax.delayedCall(0.5, this.updateNextPrev, [false, true], this)
                }
            }

        },

        onLeaveComplete: function (context) {
            trace("ON LEAVE COMPLETE -> " + context, 2);
            this.goToNext();
        },

        updateNextPrev: function (enabled, disableNext) {
            var newIndex;
            if (enabled) {

                //this.scrollDirection = scrollTop >= this.scrollTop ? 1 : -1;
                newIndex = this.index + this.scrollDirection;

                if (newIndex < 0) {
                    //disable prev
                    this.ui.nextButton.removeClass('disabled');
                    this.ui.prevButton.addClass('disabled');
                } else if (newIndex == this.scene_ar.length) {
                    //disable next
                    this.ui.nextButton.addClass('disabled');
                    this.ui.prevButton.removeClass('disabled');
                } else {
                    //enable both
                    this.ui.nextButton.removeClass('disabled');
                    this.ui.prevButton.removeClass('disabled');
                }


            } else if (!enabled && disableNext) {
                //disable next
                this.ui.nextButton.addClass('disabled');
                this.ui.prevButton.removeClass('disabled');
            } else {
                this.ui.nextButton.addClass('disabled');
                this.ui.prevButton.addClass('disabled');
            }
        },

        onNextButtonClicked: function () {
            this.scrollDirection = 1;
            this.prerenderScene(this.index + 1);
            vent.trigger('play_sfx', 'pageturnerbutton_click');
        },

        onPrevButtonClicked: function () {
            this.scrollDirection = -1;
            this.prerenderScene(this.index - 1);
            vent.trigger('play_sfx', 'pageturnerbutton_click');
        },

        bodyScroll: function () {
            var newIndex, direction = this.detectDirection();

            if (direction == 0) {
                return;
            }

            this.scrollDirection = direction;

            newIndex = this.index + this.scrollDirection;

            this.prerenderScene(newIndex);

        },

        prerenderScene: function (newIndex) {
            if (newIndex < 0) {
                this.enableScroll();
                return;
            } else if (newIndex > this.scene_ar.length - 1) {
                this.enableScroll();
                return;
            } else if (newIndex == this.scene_ar.length - 1) {
                nextScene = this.model.get('scenes')[newIndex]
                if(nextScene.interaction == undefined) {
                    this.ui.continueButton.show();
                    this.buttonEnable(this.ui.continueButton, true);
                }
            } else {
                this.ui.continueButton.fadeOut();
            }

            if (this.currentInteraction) {
                this.currentInteraction.sceneComplete();
                this.currentInteraction = null;
            }

            this.disableScroll();

            this.renderScene('leave');

            if(this.loopPlaying) {
                clearInterval(this.intervalID);
                this.trigger('mainview:activity-start');
            }
        },

        buttonEnable: function ($button, enable) {
            if(enable) {
                $button.show();
                $button.addClass('enabled button-reveal').removeClass('disabled');
                setTimeout(function () {
                    $button.removeClass('button-reveal');
                }.bind(this), 1600)
            } else {
                $button.removeClass('enabled').addClass('disabled');
            }
        },

        goToNext: function () {
            var newIndex = this.index + this.scrollDirection;

            if (newIndex < 0 || newIndex > this.scene_ar.length - 1) {
                this.enableScroll();
                return;
            }

            this.index = newIndex;
            vent.trigger('update-jira', {'item':'scene: ' + this.index});
            this.goTo(this.index);
        },

        goTo: function (n) {
            var yPos = this.$win.height()*this.index * -1

            this.ui.scrollBox.css({'top': yPos});

            this.disableScroll();

            this.$('#progress' + this.index).addClass('completed active');

            this.renderScene('enter');

        },

        onProgressClicked: function (e) {
            var $button = $(e.currentTarget), index = parseInt($button.attr('data-id'));

            this.scrollDirection = index > this.index ? 1 : -1;

            this.renderScene('leave');

            this.index = index - this.scrollDirection;
            if(index == this.scene_ar.length - 1){
                this.ui.continueButton.fadeIn();
            }

            vent.trigger('play_sfx', 'pageturnerbutton_click');
        },

        onRevealItemClicked: function () {
            /*if (complete) {
             this.enableScroll();
             }*/
            if(this.currentInteraction.isComplete()) {
                if (this.index == this.scene_ar.length - 1) {
                    this.ui.continueButton.fadeIn();
                }

                this.enableScroll();
            }
        },


        onButtonClicked: function (e) {
            var $button = $(e.currentTarget), id = $button.attr('id'), dataID = $button.attr('data-id');

            switch (dataID) {

                case 'continue':
                    this.showConclusion();
            }

            vent.trigger('play_sfx', 'button_click');
        },

        showConclusion: function () {
            //this.conclusion.$el.fadeIn();
            this.endInteraction();
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onDestroy: function () {
            for (var i = 0; i<this.tweenList.length; i++) {
                this.tweenList[i].kill();
            }
            this.$win.off('scroll', $.proxy(this.bodyScroll, this));
            this.$body.css('overflow', 'visible');
            this.$win.off('resize', $.proxy(this.onResize, this));
            this.soundPlayer.killCurrentSound();
            clearInterval(this.intervalID);
        }
    });

});
