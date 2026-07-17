/**
 * Created with IntelliJ IDEA.
 * User: SamBrick
 * Date: 16/05/2013
 * Time: 16:27
 * To change this template use File | Settings | File Templates.
 */

define(['marionette', 'tweenmax', 'text!templates/app/loadingpage.html'], function (Marionette, TweenMax, text) {
    return Marionette.ItemView.extend({
        template: text,
        ui: {
            loadingPage: '#loading-container',
            loaderMask: '.loader-mask',
            loaderMsg: '.loader-msg',
            loadingView: '#loading-view'
        },

        initialize: function (options) {
            this.preloader = options.preloader;
            this.class = options.class;
            console.log("PRELOADER CLASS: " + this.class);
            this.listenTo(this.preloader, 'progress', this.onProgressUpdated);
        },

        onRender: function() {
            this.ui.loadingView.addClass(this.class);
            this.ui.loadingPage.fadeIn();
        },

        onProgressUpdated: function (progress) {
            var perc = Math.ceil(progress*100);
            if (perc > 100) {
                perc = 100;
            }
            trace('LoadingView:progress: '+ progress, 1);
            trace('LoadingView:perc: '+ perc, 1);
            this.ui.loaderMask.css('width', perc+'%');
            this.ui.loaderMsg.text(perc+'%');
        }
    });
});