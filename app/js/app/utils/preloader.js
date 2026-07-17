/**
 * Created with JetBrains WebStorm.
 * User: johnhoffsis
 * Date: 2/6/15
 * Time: 4:36 PM
 * To change this template use File | Settings | File Templates.
 */
define(['marionette', '../vent'], function (Marionette, vent) {


    var Preloader = Marionette.Object.extend({
        loader: null,
        callback: null,
        scope: null,
        loadCompleted: false,
        loadedItems: {},
        nLoaded: 0,
        loadThrottle: 0,
        LOG_LEVEL: 0,

        initialize: function () {

        },

        createLoader: function () {
            this.loader = new createjs.LoadQueue(true);
            this.loader.installPlugin(createjs.Sound);
            this.loader.setMaxConnections(8);

            //For some reason, listenTo isn't working with Backbone 1.2.0 and higher

            /*this.listenTo(this.loader, 'fileload', this.onFileLoad);
             this.listenTo(this.loader, 'complete', this.onComplete);
             this.listenTo(this.loader, 'error', this.onError);
             this.listenTo(this.loader, 'fileerror', this.onFileError);
             this.listenTo(this.loader, 'progress', this.onProgress);*/

            this.loader.on('fileload', this.onFileLoad, this)
            this.loader.on('progress', this.onProgress, this)
            this.loader.on('complete', this.onComplete, this)
            this.loader.on('error', this.onError, this)
            this.loader.on('fileerror', this.onFileError, this)
        },

        destroyLoader: function () {
            this.loader.off('fileload', this.onFileLoad, this)
            this.loader.off('progress', this.onProgress, this)
            this.loader.off('complete', this.onComplete, this)
            this.loader.off('error', this.onError, this)
            this.loader.off('fileerror', this.onFileError, this)
            this.loader = null;
        },

        preload: function (manifest, callback, scope) {
            trace('preloader: preload')

            this.callback = callback;
            this.scope = scope;

            this.loadCompleted = false;
            this.nLoaded = 0;

            this.createLoader();

            var culledManifest = [],
                item, i;

            for(i = 0; i<manifest.length; i++) {
                item = manifest[i];
                if(!this.loadedItems[item.src]){
                    culledManifest.push(item);
                }
            }

            trace('Manifest Length: '+culledManifest.length, this.LOG_LEVEL)

            if(culledManifest.length) {

                this.loader.loadManifest(culledManifest);
            }else {
                this.onComplete(null);
            }

        },

        onProgress: function(e) {
            if (!this.loader) return;
            this.trigger('progress', this.loader.progress);
            if(this.loader.progress > 1 && !this.loadCompleted ) {
                /*setTimeout(function () {

                    this.onComplete(null);
                    trace("Preloader: forceComplete", 5)

                }.bind(this), 2000)*/
                trace("Preloader: onProgress after complete", this.LOG_LEVEL)
            }
        },

        onFileLoad: function (e) {
            if (e.item.type == 'image') {
                trace('Preloader: image loaded: '+e.item.id);
            }
            if (e.item.type === 'sound') {
                //trace('Preloader: sound loaded: '+e.item.id);

            }
            if (e.item.type == 'image') {
                //trace('Preloader: sound loaded: '+e.item.id);
            }

            this.loadedItems[e.item.src] = true;
            this.nLoaded ++;
            trace('nLoaded --> ' + e.item.id, this.LOG_LEVEL)
           // trace('preloader.progress --> ' + this.loader.progress)


        },

        onComplete: function (e) {
            if(e==null){
                if(!this.loadCompleted){
                    trace('Error: onComplete called from onPRogress [fired event: ' + !this.loadCompleted + ']', this.LOG_LEVEL)
                }
            }
            if(!this.loadCompleted) {
                setTimeout(function() {
                    this.loadCompleted = true;
                    trace('Preloader: onComplete()', this.LOG_LEVEL);
                    vent.trigger('preloader:load-complete');
                    if(this.callback != null) {
                        this.callback.call(this.scope);
                    }
                }.bind(this), this.loadThrottle);


            }

            this.destroyLoader();

        },

        onError: function (e) {
            trace('LOADING ERROR:', this.LOG_LEVEL);
            trace(e, this.LOG_LEVEL);
            trace('     id: '+e.data.id, this.LOG_LEVEL);
            trace('     src: '+e.data.src, this.LOG_LEVEL);
            alert('id: '+ e.data.id+'\nsrc:'+ e.data.src)
        },

        onFileError: function (e) {
            trace('FILE ERROR:', this.LOG_LEVEL);
            trace(e);

            //alert('id: '+ e.data.id+'\nsrc:'+ e.data.src)
        }
    });
    //_.extend(Preloader, Backbone.Events);

    return new Preloader();
})