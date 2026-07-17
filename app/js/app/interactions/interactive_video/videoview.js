/**
 * Created by jhoffsis on 6/27/16.
 */


/**
 * Created by jhoffsis on 7/13/15.
 */

define([
        "marionette",
        "app/vent",
        "text!templates/interactions/interactive-video/videoview.html"],
    function (Marionette, vent, text) {
        return Marionette.ItemView.extend({

            template : text,
            $win: null,
            videoPlaying: false,
            resumeVideo: false,
            completeLoaded: false,
            segments: [],
            timeDrag: false,
            volumeDrag: false,
            autoPause: false,
            currentClip: null,
            currentSegment: null,
            video: null,
            DEFAULT_CONTROLS: ["ctrl-play", "ctrl-volume", "ctrl-time", "ctrl-fullscreen", "ctrl-progressbar"],
            TIME_UPDATE_MARGIN: 0.5,
            LOG_LEVEL: 2,

            ui: {
                videoHolder: '.video-holder',
                video: 'video',
                controls: '.controls',
                control: '.control',
                startBtn: '.start-button',
                playPauseBtn: '.play-pause-button',
                muteBtn: '.mute-button',
                volumeControls: '.volume-controls',
                volume: '.volume',
                volumeBar: '.volume-bar',
                progress: '.progress',
                timeBar: '.time-bar',
                bufferBar: '.buffer-bar',
                currentTime: '.current-time',
                totalTime: '.total-time',
                fsButton: '.fs-button',
                actionNode: '.action-nodes',
                chapterNode: '.chapter-nodes',
                loading: '.video-loading'
            },

            events : {
                'click @ui.video': 'playPause',
                'click @ui.startBtn': 'onStartClicked',
                'click @ui.control': 'onControlClicked',
                'click .chapter-node': 'onChapterNodeClicked',
                'mousedown @ui.progress': 'onProgressClicked',
                'mousedown @ui.volume': 'onVolumeClicked',
                'mouseover @ui.volumeControls': 'onVolumeOver',
                'mouseout @ui.volumeControls': 'onVolumeOut',
                'mouseover @ui.videoHolder': 'onVidHolderOver',
                'mouseout @ui.videoHolder': 'onVidHolderOut',
                'click @ui.videoHolder': 'vidHolderClicked'
            },

            initialize: function (options) {
                trace('videoview: initialize()');
                this.model = options.model;
                this.controller = options.controller; //reference to mainview.js
                this.soundPlayer = options.soundPlayer;

                // listeners
                this.listenTo(vent, 'window:lose-focus', this.loseFocus);
                this.listenTo(vent, 'window:resume-clicked', this.getFocus);

                // initialize vars
                this.videoPlaying = false;
                this.resumeVideo = false;
                this.completeLoaded = false;
                this.autoPause = false;

                this.TIME_UPDATE_MARGIN = 1.5;

            },

            onRender: function() {
                trace('videoview: onRender()');

                this.$win = $(window);

                //this.initVideo();

                // initialize selector vars
                this.video = this.ui.video[0];

                // initialize UI states
                this.resetControls();

            },

            loadClip: function (clip, segments, nodes) {
                var poster = clip.poster || '',
                    markup = "<source src='" + clip.path + "' type='video/mp4'>";
                if (!nodes) {
                    this.hasChapters = false;
                } else {
                    this.hasChapters = nodes.chapters;
                }
                this.controlsHideOffset = !this.hasChapters ? '-45px' : '-80px'
                this.ui.video.attr('poster', poster);
                this.ui.video.html(markup);
                this.resetControls();
                this.ui.video.bind("loadedmetadata", function() {
                    // before start
                    trace("video LOADMETADATA", this.LOG_LEVEL);
                    this.initVideo(segments, nodes);
                }.bind(this));
                this.ui.startBtn.show();
                this.video.load();

            },

            resetControls: function () {
                var x_controls = _.difference(this.DEFAULT_CONTROLS, this.model.get('controls'));

                _.each(x_controls, function (id) {
                    var $controlToHide = this.ui.controls.find('.'+id);
                    $controlToHide.css('display', 'none');
                }.bind(this));
                this.updateProgress(0);

            },

            initVideo: function (segments, nodes) {
                this.ui.currentTime.text(this.timeFormat(0));
                this.ui.totalTime.text(this.timeFormat(this.video.duration));
                this.updateVolume(0, 0.7);

                var nodes = nodes || {interactions:false, chapters: false}

                this.initSegments(segments, nodes);

                //start to get video buffering data
                setTimeout(function () {
                    trace("START BUFFER!", this.LOG_LEVEL);
                    this.startBuffer();
                }.bind(this), 150);

                this.ui.video.bind("timeupdate", function() {
                    this.onTimeUpdate();
                    trace("video TIMEUPDATE", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("canplay", function() {
                    this.toggleLoading(false);
                    trace("video CANPLAY", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("canplaythrough", function() {
                    this.completeLoaded = true;
                    this.trigger('videoview:can-play-through');
                    trace("video CANPLAYTHROUGH", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("seeking", function() {
                    if (!this.completeLoaded) {
                        this.toggleLoading(true);
                    }
                    trace("video SEEKING", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("seeked", function() {
                    trace("video SEEKED", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("waiting", function() {
                    this.toggleLoading(true);
                    trace("video WAITING", this.LOG_LEVEL);
                }.bind(this));

                this.ui.video.bind("ended", function() {
                    this.onVideoComplete();
                    trace("video ENDED", this.LOG_LEVEL);
                }.bind(this));

                $(document).on('mouseup', function(e) {
                    if(this.timeDrag) {
                        this.timeDrag = false;
                        this.updateProgress(e.pageX);
                    }
                    if(this.volumeDrag) {
                        this.volumeDrag = false;
                        this.updateVolume(e.pageX);
                    }
                }.bind(this));

                $(document).on('mousemove', function(e) {
                    if(this.timeDrag) {
                        this.updateProgress(e.pageX);
                    }
                    if(this.volumeDrag) {
                        this.updateVolume(e.pageX);
                    }
                }.bind(this));

                this.ui.video.show();

            },

            initSegments: function (segments, nodes) {
                var hasChapters = nodes.chapters,
                    hasInteractions = nodes.interactions,
                    maxduration = this.video.duration,
                    $actionNodes = this.ui.actionNode,
                    $chapterNodes = this.ui.chapterNode,
                    $node, perc, nodeTime, interaction;

                this.segments = segments;



                if (hasChapters) {
                    $chapterNodes.empty();

                    _.each(segments, function(segment, index) {
                        var title = segment.titleShort != undefined ? segment.titleShort : segment.title;
                        $node = this.$('.chapter-node-prototype').clone();
                        $node.removeClass('chapter-node-prototype').addClass('chapter-node');
                        $node.attr('data-id', 'node-' + segment.id);
                        $node.find('h3').html(title);
                        var $thumb = $node.find('.chapter-thumb');
                        $thumb.find('p').html(segment.description);
                        $node.data('node', segment);
                        segment.completed = false;
                        $chapterNodes.append($node);
                    }.bind(this));
                }

                if (hasInteractions) {
                    $actionNodes.empty();
                    _.each(segments, function(segment, index) {
                        nodeTime = segment.startTime != undefined ? segment.startTime : segment.triggerTime;
                        $node = $('<div class="action-node" data-id="node-' + segment.id + '"></div>');
                        $node.data('node', segment);
                        perc = nodeTime / maxduration / 10;
                        $node.css({left: perc + '%'});
                        segment.percent = perc;
                        segment.completed = false;
                        $actionNodes.append($node);
                    }.bind(this));
                }

            },

            updateChapter: function (id) {

                trace('videoView.updateChapter()', 6);

                if (id == undefined) {
                    return;
                }

                var $chapterNode = this.ui.chapterNode.find('[data-id="node-' + id + '"]');

                if (!$chapterNode.length || !this.hasChapters) {
                    return;
                }
                this.$('.chapter-node').removeClass('active');
                $chapterNode.addClass('active');
            },

            updateSegment: function (id, completed) {
                var segment = _.find(this.segments, function(segment) { return segment.id == id; }),
                    $actionNode = this.ui.actionNode.find('[data-id="node-' + id + '"]'),
                    $chapterNode = this.ui.chapterNode.find('[data-id="node-' + id + '"]');

                if (segment == undefined) {
                    return;
                }
                segment.completed = completed;

                if (completed) {
                    $actionNode.addClass('completed');
                    $chapterNode.addClass('completed');
                } else {
                    $actionNode.removeClass('completed');
                    $chapterNode.removeClass('completed');
                }
            },

            onStartClicked: function () {
                this.ui.startBtn.hide();
                this.playPause();
            },

            onControlClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');

                switch (dataID) {
                    case 'play-pause':
                        this.playPause();
                        break;
                    case 'start':
                        this.playPause();
                        break;
                    case 'mute':
                        this.toggleMute();
                        break;
                    case 'fs':
                        this.goFullScreen();
                        break;
                    default:
                        break;
                }

            },

            onChapterNodeClicked: function (e) {
                var $chapter = $(e.currentTarget),
                    segment = $chapter.data('node');

                this.trigger('videoview:new-chapter', segment);
            },

            onProgressClicked: function (e) {
                this.latestTime = this.video.currentTime;
                this.latestPosition = this.ui.timeBar.css('width');
                this.timeDrag = true;
                this.updateProgress(e.pageX);
            },

            onVolumeClicked: function (e) {
                this.volumeDrag = true;
                this.video.muted = false;
                this.ui.muteBtn.removeClass('muted');
                this.updateVolume(e.pageX);
            },

            onVolumeOver: function (e) {
                this.ui.volume.addClass('show');
            },

            onVolumeOut: function (e) {
                this.ui.volume.removeClass('show');
            },

            onVidHolderOver: function (e) {
                this.toggleControls(true);
                trace('onVidHolderOut', this.LOG_LEVEL);
            },

            onVidHolderOut: function (e) {
                if (!this.volumeDrag && !this.timeDrag) {
                    this.toggleControls(false);
                }
                trace('onVidHolderOut', this.LOG_LEVEL);
            },

            vidHolderClicked: function (e) {

            },

            playPause: function () {
                if(this.video.paused || this.video.ended) {
                    this.ui.playPauseBtn.addClass('paused');
                    if (this.autoPause) {
                        if (this.video.currentTime + this.TIME_UPDATE_MARGIN < this.video.duration) {
                            this.video.currentTime += this.TIME_UPDATE_MARGIN;
                        }

                        this.autoPause = false;
                    }
                    this.video.play();
                    this.videoPlaying = true;
                }
                else {
                    this.ui.playPauseBtn.removeClass('paused');
                    this.video.pause();
                    this.videoPlaying = false;
                }
            },

            toggleMute: function () {
                this.video.muted = !this.video.muted;
                this.ui.muteBtn.toggleClass('muted');
                if(this.video.muted) {
                    this.ui.volumeBar.css('width',0);
                }
                else{
                    this.ui.volumeBar.css('width', this.video.volume*100+'%');
                }
            },

            goFullScreen: function () {
                if($.isFunction(this.video.webkitEnterFullscreen)) {
                    this.video.webkitEnterFullscreen();
                }
                else if ($.isFunction(this.video.mozRequestFullScreen)) {
                    this.video.mozRequestFullScreen();
                }
                else {
                    alert('Your browsers doesn\'t support fullscreen');
                }
            },

            updateProgress: function (xPos) {

                if(isNaN(this.video.duration)) {
                    return;
                }



                var maxduration = this.video.duration,
                    position = xPos - this.ui.progress.offset().left,
                    perc = 100 * position / this.ui.progress.width(),
                    segment,
                    allowFreeProgress = this.model.get('allowFreeProgress');

                if (!allowFreeProgress && this.segments.length) {
                    segment = _.findWhere(this.segments, {completed: false});
                    if (segment && perc > segment.percent) {
                        trace('perc is > segment.percent', this.LOG_LEVEL + 4);
                        return;
                        this.video.currentTime = this.latestTime;
                        this.ui.timeBar.css('width', this.latestPosition);
                    }
                }

                if(perc > 100) {
                    perc = 100;
                }
                if(perc < 0) {
                    perc = 0;
                }
                this.ui.timeBar.css('width', perc + '%');
                this.video.currentTime = maxduration * perc / 100;
            },

            jumpToTime: function (time) {
                this.model.set('allowFreeProgress', true);
                this.ui.startBtn.hide();
                var perc = 100* time / this.video.duration;
                this.ui.timeBar.css('width', perc + '%');

                this.video.currentTime = time;
                this.playPause();
            },

            jumpToChapter: function (time) {
                this.ui.startBtn.hide();
                var perc = 100* time / this.video.duration;
                this.ui.timeBar.css('width', perc + '%');

                this.video.currentTime = time;
            },

            updateVolume: function (xPos, volume) {
                var $volume = this.ui.volume,
                    percentage, position;
                //if only volume have specificed
                //then direct update volume
                if (volume) {
                    percentage = volume * 100;
                } else {
                    position = xPos - $volume.offset().left;
                    percentage = 100 * position / $volume.width();
                }

                if(percentage > 100) {
                    percentage = 100;
                }
                if(percentage < 0) {
                    percentage = 0;
                }

                //update volume bar and video volume
                this.ui.volumeBar.css('width', percentage+'%');
                this.video.volume = percentage / 100;

                //change sound icon based on volume
                if(this.video.volume == 0){
                    this.ui.muteBtn.addClass('muted');
                } else {
                    this.ui.muteBtn.removeClass('muted')
                }

            },

            startBuffer: function () {

                if (!this.video || !this.video.buffered.length) {
                    trace('Swing and miss...buffering', this.LOG_LEVEL);
                    setTimeout(function () {
                        this.startBuffer();
                    }.bind(this), 500);
                    return;
                }

                var currentBuffer = this.video.buffered.end(0),
                    maxduration = this.video.duration,
                    perc = 100 * currentBuffer / maxduration;

                this.ui.bufferBar.css('width', perc+'%');
                trace('...buffering: cb / maxdur: ' + currentBuffer + ', ' + maxduration, this.LOG_LEVEL);

                if (currentBuffer < maxduration) {
                    //TODO: change to TweenMax.delayedCall
                    setTimeout(function () {
                        this.startBuffer();
                    }.bind(this), 500);
                }
            },

            onTimeUpdate: function () {
                var currentPos = this.video.currentTime,
                    maxduration = this.video.duration,
                    perc = 100 * currentPos / maxduration;

                this.ui.timeBar.css('width', perc+'%');
                this.ui.currentTime.text(this.timeFormat(currentPos));

                this.trigger('videoview:update-time', currentPos, this.timeDrag);
                trace('onTimeUpdate', this.LOG_LEVEL);

            },

            executePause: function () {
                this.ui.playPauseBtn.removeClass('paused');

                this.video.pause();
                this.autoPause = true;
                this.videoPlaying = false;
                this.toggleControls(false);
                //this.trigger('videoview:video-paused-for-action', this.currentSegment);
            },

            resume: function () {
                if (this.videoPlaying) {
                    return;
                }

                if (this.video.currentTime > this.video.duration || this.video.currentTime + this.TIME_UPDATE_MARGIN >= this.video.duration) {
                  this.onVideoComplete();
                  return;
                }
                this.playPause();
            },

            //Time format converter - 00:00
            timeFormat: function(seconds) {
                var m = Math.floor(seconds/60)<10 ? "0"+Math.floor(seconds/60) : Math.floor(seconds/60),
                    s = Math.floor(seconds-(m*60))<10 ? "0"+Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
                return m+":"+s;
            },

            toggleControls: function (show) {
                var bottom = show ? '0px' : this.controlsHideOffset;

                TweenMax.to(this.ui.controls, 0.3, {bottom: bottom, ease:Quad.easeIn});
                if (show) {
                    this.ui.controls.addClass('show');
                } else {
                    this.ui.controls.removeClass('show');
                }
            },

            toggleLoading: function (show) {
                var autoAlpha = show ? 1.0 : 0.0;

                TweenMax.to(this.ui.loading, 0.3, {autoAlpha: autoAlpha});
            },

            onVideoComplete: function () {
                this.ui.playPauseBtn.removeClass('paused');
                this.video.pause();
                this.videoPlaying = false;
                this.trigger('videoview:video-complete', this.currentClip);
            },

            loseFocus: function () {
                if(this.videoPlaying) {
                    this.video.pause();
                    this.resumeVideo = true;
                }
            },

            getFocus: function () {
                if(this.resumeVideo) {
                    this.video.play();
                }
                this.resumeVideo = false;
            }
        });

    });