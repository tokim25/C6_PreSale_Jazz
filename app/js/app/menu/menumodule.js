/**
 * Created by jhoffsis on 7/27/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/menu/menumodel', 'app/menu/menuview'], function(Backbone, Marionette, vent, Model, MainView){

    var MenuModule = Marionette.Object.extend({

        name: 'Menu',

        initialize: function (options) {
            this.app = options.app;
        },

        start: function() {
            trace('Menu module onStart');
            this.model = new Model({app: this.app, url:this.options.appModule.url});
            this.listenTo(this.model, 'menumodel:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('Menu: onModelLoaded()');

            vent.trigger('appmodule:ready', this);
        },

        ready: function () {
            this.initView();
        },

        initView: function () {
            this.view = new MainView({model:this.model, app: this.app});
            this.listenTo(this.view, 'menuview:item-selected', this.onItemSelected);
        },

        onItemSelected: function () {
            vent.trigger('menu:item-selected', this.model.get('currentSelection'));
        },

        onDestroy: function () {

        },

    });

    return MenuModule;


});