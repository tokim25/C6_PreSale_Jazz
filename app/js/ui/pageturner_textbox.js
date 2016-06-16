/**
 * Created by jhoffsis on 8/11/15.
 */


define( ["marionette", "text!templates/ui/pageturner_textbox.html"], function (Marionette, text) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            textbox: '.pt-txt-box',
            header: '.pt-txt-header',
            hr: '.pt-txt-hr',
            ornament: '.pt-txt-ornament',
            body: '.pt-txt-body'
        },

        tl: null,

        initialize: function (options) {
            this.completeCallback = options.completeCallback || null;
            this.callbackScope = options.callbackScope || null;
        },

        onRender: function() {

            this.tl = this.createTimeline();
        },

        createTimeline: function () {
            var tl = new TimelineMax({paused:true});


            var enter_down = new TimelineMax({onComplete:this.onTweenComplete, onCompleteScope:this, onCompleteParams:['enter_down']});

            enter_down.add(TweenMax.set(this.ui.textbox, {
                background: 'rgba(0,0,0,0)'
            }));

            enter_down.add(TweenMax.from(this.ui.body, 0.5, {
                autoAlpha: 0.0,
                top: '+=40',
                ease: Power3.easeIn
            }));

            /*enter_down.add(TweenMax.from(this.ui.ornament, 0.38, {
                left: '700px',
                autoAlpha: 0.0
            }), 0.3);

            enter_down.add(TweenMax.from(this.ui.hr, 0.4, {
                backgroundPosition: '800px 0px'
            }), 0.3);
            enter_down.set(this.ui.ornament, {
                autoAlpha: 0.0
            })*/

            enter_down.add(TweenMax.from(this.ui.header, 0.5, {
                rotationX: '-=180deg',
                autoAlpha: 0.0
            }), '-=.2');

            enter_down.add(TweenMax.to(this.ui.textbox, 1.0, {
                background: 'rgba(0,0,0,0.5)'
            }));

            tl.add(enter_down, 'enter_down');

            var leave_down = new TimelineMax({onComplete:this.onTweenComplete, onCompleteScope:this, onCompleteParams:['leave_down']});

            leave_down.add(TweenMax.to(this.ui.textbox, 1.0, {
                background: 'rgba(0,0,0,0.0)'
            }));

            leave_down.add(TweenMax.to(this.ui.textbox, 0.7, {
                top: '-=50px',
                autoAlpha: 0.0
            }));

            tl.add(leave_down, 'leave_down');

            var enter_up = new TimelineMax({onComplete:this.onTweenComplete, onCompleteScope:this, onCompleteParams:['enter_up']});

            enter_up.set(this.ui.textbox, {autoAlpha:0.0, immediateRender:false});
            enter_up.add(TweenMax.to(this.ui.textbox, 0.5, {
                top: '+=50px',
                autoAlpha: 1.0,
                ease:Power1.easeOut
            }));

            enter_up.add(TweenMax.to(this.ui.textbox, 1.0, {
                background: 'rgba(0,0,0,0.5)'
            }));

            tl.add(enter_up, 'enter_up');

            var leave_up = new TimelineMax({onComplete:this.onTweenComplete, onCompleteScope:this, onCompleteParams:['leave_up']});

            leave_up.add(TweenMax.to(this.ui.textbox, 0.3, {
                top: '+=30px',
                autoAlpha: 0.0
            }));

            tl.add(leave_up, 'leave_up');


            return tl;

        },

        onTweenComplete: function (context) {
            this.tl.pause();
            if(this.completeCallback != null) {
                this.completeCallback.call(this.callbackScope, context);
                //this.onTweenComplete.call(this.onTweenCompleteScope)
            }
        },

        setText: function (textObj) {

            if(textObj.header != undefined) {
                this.ui.header.html(textObj.header);
            }
            if(textObj.body != undefined) {
                this.ui.body.html(textObj.body);
            }

            //this.ui.ornament.css('top', this.ui.hr.position().top);
        },

        setClass: function (newClass) {
            this.ui.textbox.removeClass().addClass('pt-txt-box ' + newClass);
        },

        setCSS: function (css) {
            this.ui.textbox.css(css);
        }
    });

});