/**
 * Created with IntelliJ IDEA.
 * User: SamBrick
 * Date: 25/02/2015
 * Time: 13:12
 * To change this template use File | Settings | File Templates.
 */


require.config({
    waitSeconds: 250,
    paths : {
        underscore : '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.2/underscore-min',
        jquery : '//cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min',
        'jquery-ui': '//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min',
        'jquery-ui-touch-punch': '//cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.2/jquery.ui.touch-punch.min',
        tweenmax: '//cdnjs.cloudflare.com/ajax/libs/gsap/1.15.1/TweenMax.min',
        backbone : '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        'backbone.wreqr' : '//cdnjs.cloudflare.com/ajax/libs/backbone.wreqr/0.1.0/backbone.wreqr.min',
        marionette : '//cdnjs.cloudflare.com/ajax/libs/backbone.marionette/1.8.6/backbone.marionette',
        templates : '../templates',
        text : 'lib/text',
        json2 : 'lib/json2',
        apiwrapper : 'app/tracking/apiwrapper',
        easeljs: '//code.createjs.com/easeljs-0.8.0.min',
        preloadjs: '//code.createjs.com/preloadjs-0.6.0.min',
        soundjs: '//code.createjs.com/soundjs-0.6.0.min',
        tweenjs: '//code.createjs.com/tweenjs-0.6.0.min',
        scrollmagic: 'lib/plugins/jquery.ScrollMagic'
    },
    shim : {
        jquery : {
            exports : 'jQuery'
        },
        'jquery-ui': {
            deps: ['jquery']
        },
        'jquery-ui-touch-punch': {
            deps: ['jquery', 'jquery-ui']
        },
        tweenmax: {
            deps: ['jquery'],
            exports: 'TweenMax'
        },
        underscore : {
            exports : '_'
        },
        marionette : {
            deps: ['backbone'],
            exports: 'Marionette'
        },
        backbone : {
            deps : ['jquery', 'underscore'],
            exports : 'Backbone'
        },
        'backbone.wreqr' : {
            deps : ['backbone'],
            exports : 'Wreqr'
        },
        'backbone.babysitter' : {
            deps : ['backbone'],
            exports : 'Babysitter'
        },
        easeljs : {exports: 'createjs'},
        tweenjs:['easeljs'],
        preloadjs: {
            deps: ['easeljs'],
            exports: 'createjs.LoadQueue'
        },
        soundjs: {
            deps: ['preloadjs'],
            exports: 'createjs.Sound'
        }

    }
});

require(
    ["jquery",
        "jquery-ui",
        "jquery-ui-touch-punch",
        "tweenmax",
        "underscore",
        "backbone",
        "backbone.wreqr",
        "marionette",
        "scrollmagic",
        "app/app",
        "app/utils/global",
        "json2",
        "app/tracking/apiwrapper",
        "easeljs",
        "tweenjs",
        "soundjs",
        "preloadjs"
    ],
    function($, Jqueryui, Jqueryuitouchpunch, TweenMax, _, Backbone, Wreqr, Marionette, ScrollMagic, App) {
        $(function() {

            //var academy = App;
            academy = App;

            academy.start();

        });
    }
);