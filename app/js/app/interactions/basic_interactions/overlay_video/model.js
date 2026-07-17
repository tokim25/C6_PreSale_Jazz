/**
 * Created by jhoffsis on 7/13/15.
 */

define(["backbone", "app/vent"], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            name: "Interactive Video Module Model"
        },

        initialize: function(options){
            trace("moduleModel: init()");

            this.url = options.url || null;
            this.menuModel = options.menuModel || null;


            if(this.url) {
                this.fetch({
                    success: function () {
                        trace('module.model.fetch success');
                        this.onDataReady();
                    }.bind(this)
                });
            } else {
                this.onDataReady();
            }
        },

        onDataReady: function () {

            this.reinitialize();
            this.trigger('model:init-complete');
        },

        reinitialize: function() {
            // set initial values here
            this.clips = new Backbone.Collection(this.get('clips'));

            this.clips.each(function (clip) {
                _.each(clip.get('segments'), function (segment) {
                    if (segment.triggerTime != undefined && _.isString(segment.triggerTime)) {
                        segment.triggerTime = this.translateTime(segment.triggerTime);
                    }
                    if (segment.startTime != undefined && _.isString(segment.startTime)) {
                        segment.startTime = this.translateTime(segment.startTime);
                    }
                    if (segment.endTime != undefined && _.isString(segment.endTime)) {
                        segment.endTime = this.translateTime(segment.endTime);
                    }
                }.bind(this));

            }.bind(this));
            this.interactions = new Backbone.Collection(this.get('interactions'));
        },

        translateTime: function (time) {
            var ar = time.split(':'),
                min = ar[0]*60*1000,
                sec = ar[1] * 1000,
                totalTime = min + sec;

            return totalTime;


        },


    });

    return Model;

});