/**
 * Created with IntelliJ IDEA.
 * User: John Hoffsis
 * Date: 25/02/2015
 * Time: 13:12
 * To change this template use File | Settings | File Templates.
 */


require.config({
    waitSeconds: 250,
    paths : {
        underscore : 'lib/underscore',
        jquery : 'lib/jquery-1.11.3',
        'jquery-ui': 'lib/jquery-ui-1.11.3.custom',
        'jquery-ui-touch-punch': 'lib/jquery.ui.touch-punch',
        tweenmax: 'lib/greensock/TweenMax',
        drawsvgplugin: 'lib/greensock/plugins/DrawSVGPlugin',
        scrolltoplugin: 'lib/greensock/plugins/ScrollToPlugin',
        cssplugin: 'lib/greensock/plugins/CSSPlugin',
        splittext: 'lib/greensock/utils/SplitText',
        backbone : 'lib/backbone',
        'backbone.wreqr' : 'lib/backbone.wreqr',
        'backbone.babysitter' : 'lib/backbone.babysitter',
        marionette : 'lib/backbone.marionette',
        templates : '../templates',
        text : 'lib/text',
        json2 : 'lib/json2',
        apiwrapper : 'app/tracking/SCORM_API_wrapper',
        preloadjs: 'lib/createjs/preloadjs-0.6.0.min',
        soundjs: 'lib/createjs/soundjs-0.6.2.min',
        ScrollMagic: 'lib/ScrollMagic',
        'ScrollMagic.debug': 'lib/plugins/debug.addIndicators',
        'animation.gsap': 'lib/plugins/animation.gsap',
        'jquery.winFocus': 'lib/plugins/winfocus'
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
        drawsvgplugin: {
            deps: ['tweenmax'],
            exports: 'DrawSVGPlugin'
        },
        cssplugin: {
            deps: ['tweenmax'],
            exports: 'CSSPlugin'
        },
        splittext: {
            deps: ['tweenmax'],
            exports: 'SplitText'
        },
        scrolltoplugin: {
            deps: ['tweenmax'],
            exports: 'ScrollToPlugin'
        },
        'animation.gsap': {
            deps: ['tweenmax']
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
        preloadjs: {
            exports: 'createjs.LoadQueue'
        },
        soundjs: {
            deps: ['preloadjs'],
            exports: 'createjs.Sound'
        },
        ScrollMagic: {
            deps: ['jquery']
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
        "ScrollMagic",
        "app/app",
        'ScrollMagic.debug',
        "animation.gsap",
        "drawsvgplugin",
        "splittext",
        "scrolltoplugin",
        "cssplugin",
        "app/utils/utilities",
        "json2",
        "app/tracking/SCORM_API_wrapper",
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
