/**
 * Created by jhoffsis on 2/10/16.
 */


define(['backbone',
    'marionette',
    'app/vent',
    'app/ta/taview',
    'app/ta/tamodel'],
    function(Backbone, Marionette, vent, MainView, Model){

    var TAModule = Marionette.Object.extend({

        name: 'TA',


        initialize: function (options) {
            this.app = options.app;
        },

        start: function() {
            trace('TA module onStart');
            this.model = new Model({url:this.options.appModule.url});

            this.listenTo(this.model, 'model:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('TA: onModelLoaded()');
            //this.initView();
            vent.trigger('appmodule:ready', this);
        },

        ready: function () {
            this.initView();
        },

        initView: function () {
            this.view = new MainView({model:this.model, app: this.app});
        }

    });

    return TAModule;


});