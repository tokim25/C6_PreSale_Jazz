/**
 * Created by jhoffsis on 7/27/15.
 */

define(['backbone', 'marionette', 'app/vent', 'app/soundmap/soundmapmodel'], function(Backbone, Marionette, vent, Model){

    var NavModule = Marionette.Object.extend({

        name: 'Soundmap',

        initialize: function (options) {
            this.app = options.app;
            this.soundPlayer = this.app.soundPlayer;
            this.listenTo(vent, 'play_sfx', this.playSFX);
        },

        start: function() {
            trace('Soundmap module onStart');
            this.model = new Model({url:this.options.appModule.url});

            this.listenTo(this.model, 'soundmapmodel:ready', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('Preload: onModelLoaded()');
            //this.initView();
            vent.trigger('appmodule:ready', this);
            this.soundMap = this.model.get('soundmap');
        },

        playSFX: function (id) {
            var soundObj = this.soundMap[id],
                src;

            trace('PLAY SFX: ' + id, 4);

            if(soundObj != undefined) {
                src = soundObj.src
                this.soundPlayer.playSFX(src);
            }
        },

        ready: function () {
            //this.initView();
        },

    });

    return NavModule;


});