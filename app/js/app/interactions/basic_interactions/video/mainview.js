/**
 * Created by jhoffsis on 11/18/16.
 */
/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette",
  "app/vent",
  "app/interactions/interactive_video/videoview"], function (Marionette, vent, VideoView) {
  return Marionette.ItemView.extend({

    name: 'Basic Video',

    ui: {
      //
      instrux: '.onscreen-instrux',
      continueButton: '.continue-button',
      videoContainer: '.video-container',
      scrim: '.scrim-background'
    },

    events: {
      'click @ui.continueButton': 'onButtonClicked',
      'mouseover @ui.mainContainer': 'onVidOver',
      'mouseout @ui.mainContainer': 'onVidOut'
    },

    initialize: function (options) {
      this.template = options.template;
      this.model = options.model;

      var video_config = this.model.get('videoConfig') || {
          allowFreeProgress: false,
          controls: ["ctrl-play", "ctrl-volume", "ctrl-time", "ctrl-fullscreen", "ctrl-progressbar"]
        }

      this.videoView = new VideoView({model: new Backbone.Model(video_config), controller: this, soundPlayer: this.soundPlayer});

      this.listenTo(this.videoView, 'videoview:video-complete', this.onVideoComplete);
      this.listenTo(this.videoView, 'videoview:update-time', this.onUpdateTime);

      // flag signals when video has actually been paused so that user can interact with interaction
      // and controls are hidden so vid progress/pause/play are effectively disabled
      this.pausedForInteraction = false;
    },

    onRender: function() {

      this.ui.scrim.hide();

      this.ui.videoContainer.append(this.videoView.render().el);

    },

    startInteraction: function () {
      this.trigger('mainview:activity-start');
      var src = this.model.get('videoURL');
      this.videoView.loadClip(src, []);

    },

    onVidOver: function (e) {
      if(this.pausedForInteraction) {
        return;
      }
      this.videoView.toggleControls(true);
      trace('onVidHolderOut', this.LOG_LEVEL);
    },

    onVidOut: function (e) {
      if (!this.videoView.volumeDrag && !this.videoView.timeDrag) {
        this.videoView.toggleControls(false);
      }
      trace('onVidHolderOut', this.LOG_LEVEL);
    },

    onVideoComplete: function () {
      this.buttonEnable(this.ui.continueButton, true);
    },

    buttonEnable: function ($button, enable) {
      if(enable) {
        $button.addClass('enabled button-reveal').removeClass('disabled');
        setTimeout(function () {
          $button.removeClass('button-reveal');
        }.bind(this), 1600)
      } else {
        $button.removeClass('enabled').addClass('disabled');
      }
    },

    onButtonClicked: function (e) {
      var $button = $(e.currentTarget),
        id = $button.attr('id'),
        dataID = $button.attr('data-id');

      switch(dataID) {
        case 'continue':
          this.endInteraction();
          break;
      }
    },

    endInteraction: function () {
      this.trigger('interaction:complete', this.model);
    }


  });

});