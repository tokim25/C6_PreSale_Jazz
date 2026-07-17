/**
 * Created with JetBrains WebStorm.
 * User: johnhoffsis
 * Date: 2/6/15
 * Time: 3:10 PM
 * To change this template use File | Settings | File Templates.
 */


define(['backbone', 'marionette', 'tweenmax'], function (Backbone, Marionette, TweenMax) {

    var SoundPlayer = {
        loop: null,
        loop_vol: 0.2,
        stored_loop_vol: 0.2,
        sfx_vol: 1,
        loop_damp: .1,
        currentSound: null,
        callback: null,
        scope: null,
        sfxPlaying: {},

        playSound: function (id, options, callback, scope) {
            trace('playSound(): '+id);
            options = options || {};
            options.interrupt = createjs.Sound.INTERRUPT_ANY;
            options.loop = options.loop || 0;

            trace('soundPlayer playSound('+id+')');

            if(this.currentSound) {
                this.killCurrentSound();
            }

            if(callback) {
                this.callback = callback;
                this.scope = scope;
            }
            if(this.isPaused) {
                options.volume = 0;
            }
            this.currentSound = createjs.Sound.play(id, options);

            this.currentSound.on('succeeded', createjs.proxy(this.dampenLoop, this));
            this.currentSound.on('complete', createjs.proxy(this.onSoundComplete, this));

            //this.listenTo(this.currentSound, 'succeeded', this.dampenLoop);
            //this.listenTo(this.currentSound, 'complete', this.onSoundComplete);

            return this.currentSound;
        },

        onSoundComplete: function () {
            if(this.callback) {
                this.currentSound.off('complete');
                //this.stopListening(this.currentSound, 'complete');
                this.callback.call(this.scope);
                this.callback = null;
                this.scope = null;
                this.currentSound = null;
            }

            if(this.loop) {
                this.undampenLoop();
            }
        },

        playSFX: function (id, options) {
            options = options || {};
            options.interrupt = createjs.Sound.INTERRUPT_ANY;
            options.volume = this.sfx_vol;
            trace('soundPlayer playSFX('+id+')');
            var sound = createjs.Sound.play(id, options);
            //trace('sound: '+sound.toString()+'  state: '+sound.playState);
            sound.on('complete', createjs.proxy(this.onSFXComplete, this))
            //this.listenTo(sound, 'complete', this.onSFXComplete);
            this.sfxPlaying[sound.src] = sound;
            return sound;
        },

        onSFXComplete: function (e) {
            this.removeSFX(e.target.src);
        },

        killAllSFX: function () {
            var me = this;
            _.each(this.sfxPlaying, function (sound, id) {
                sound.off('complete');
                //me.stopListening(sound, 'complete');
                sound.stop();
                delete me.sfxPlaying[id]
                trace('soundPlayer.killingSFX(): '+id);
            });
        },

        removeSFX: function(id) {
            if(this.sfxPlaying[id]) {
                var sound = this.sfxPlaying[id];
                sound.off('complete');
                //this.stopListening(sound, 'complete');
                sound.stop();
                delete this.sfxPlaying[id];
                trace('soundPlayer.removeSFX(): '+id);
            }

        },

        playLoop: function (id, options) {
            trace('playLoop(): '+id);
            if(this.loop) {
                this.killLoop();
            }
            options = options || {};
            options.loop = -1;
            options.volume = this.loop_vol;
            options.interrupt = createjs.Sound.INTERRUPT_ANY;
            this.loop = createjs.Sound.play(id, options);
            //trace('this.loop: '+this.loop.toString()+'  state: '+this.loop.playState);
            return this.loop;
        },

        dampenLoop: function () {
            trace('soundPlayer.dampenLoop()');
            //this.stopListening(this.currentSound, 'succeeded');
            this.currentSound.off('succeeded');
            if(!this.loop){
                return;
            }
            TweenMax.to(this.loop, 0.3, {volume: this.loop_damp})
            //this.loop.setVolume(this.loop_damp);
        },

        undampenLoop: function () {
            trace('soundPlayer.undampenLoop()');
            if(!this.loop){
                return;
            }

            TweenMax.to(this.loop, 0.5, {delay: 0.3, volume: this.loop_vol})
            //this.loop.setVolume(this.loop_vol);
        },

        fadeLoop: function (callback, scope) {
            trace('soundPlayer.fadeLoop()');
            if(!this.loop) {return}

            this.killCurrentSound();
            this.killAllSFX();
            if(callback) {
                this.callback = callback;
                this.scope = scope;
            }
            if(this.loop) {
                TweenMax.to(this.loop, 1, {volume: 0, onComplete:this.onLoopFadeComplete, onCompleteScope:this})
            }

        },

        onLoopFadeComplete: function () {
            trace('soundPlayer.onLoopFadeComplete()');
            if(this.callback) {
                this.callback.call(this.scope);
                this.callback = null;
                this.scope = null;
            }
            this.loop.destroy();
            this.loop = null;
        },

        muteLoop: function () {
            if(this.loop) {
                TweenMax.to(this.loop,.5, {volume: 0});
            }
        },

        unmuteLoop: function () {
            if(this.loop) {
                TweenMax.to(this.loop,.5, {volume: this.loop_vol});
            }
        },

        soundOff: function () {
            this.stored_loop_vol = this.loop_vol;
            this.loop_vol = 0.0;
            if(this.loop) {
                TweenMax.set(this.loop, {volume: this.loop_vol});
            }
        },

        soundOn: function () {
            this.loop_vol = this.stored_loop_vol;
            if(this.loop) {
                TweenMax.set(this.loop, {volume: this.loop_vol});
            }
        },

        killLoop: function() {
            if(this.callback) {
                this.callback.call(this.scope);
                this.callback = null;
                this.scope = null;
                //this.loop.destroy();
            }
            if(this.loop) {
                this.loop.stop();
                this.loop = null;
            }
        },

        killCurrentSound: function () {
            if(this.callback) {
                this.callback = null;
                this.scope = null;
            }
            if(this.currentSound) {
                this.currentSound.off('complete');
                this.currentSound.off('succeeded');
                //this.stopListening(this.currentSound, 'complete');
                //this.stopListening(this.currentSound, 'succeeded');
                this.currentSound.stop();
                //this.currentSound.destroy();
                this.currentSound = null;
            }
        },

        killAll: function () {
            this.killCurrentSound();
            this.killLoop();
            this.killAll();
        },

        muteAll: function () {

            this.sfx_vol = 0;
            this.loop_vol = 0;
            this.loop_damp = 0;
        },

        pauseAll: function () {
            this.isPaused = true;
            if(this.loop) {
                this.loop.paused = true;
            }

            if(this.currentSound) {
                this.currentSound.paused = true;
            }
        },

        resumeAll: function () {
            this.isPaused = false;
            if(this.loop && this.loop.paused) {
                this.loop.paused = false;
            }

            if(this.currentSound && this.currentSound.paused) {
                this.currentSound.paused = false;
            }
        }
    };
    //_.extend(SoundPlayer, Backbone.Events);
    return SoundPlayer;
})
