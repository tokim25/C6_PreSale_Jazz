/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent", "ui/popup", "text!templates/ui/popup_feedback.html"], function (Marionette, vent, Popup, popup_template) {

    return Marionette.ItemView.extend({

        name: 'Rehearse',

        ui: {
            //
            instrux: '.onscreen-instrux',
            continueButton: '.continue-button',
            rehearseContent: '.rehearse-content',
            recordContainer: '.video-record-container',
            recordIndicator: '.record-indicator',
            playbackContainer: '.video-playback-container',
            vidButtons: '.video-buttons',
            recordButton: '.video-btn-record',
            stopButton: '.video-btn-stop',
            downloadButton: '.video-btn-download',
            alertContainer: '.alert-container',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.recordButton': 'onButtonClicked',
            'click @ui.stopButton': 'onButtonClicked',
            'click @ui.downloadButton': 'onButtonClicked',
            'click .input-checkbox': 'onCheckboxClicked'
        },

        LOG_LEVEL: 6,

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.mediaRecorder;
            this.chunks = [];
            this.count = 0;

            this.isRecording = false;
            this.hasBeenDownloaded = false;
            this.requireDownload = this.model.get('requireDownload') == true;
            this.timerInterval = null;

            if(this.getBrowser() == "Chrome"){
                this.constraints = {audio: true, video: {  mandatory: {  minWidth: 640,  maxWidth: 640, minHeight: 480,maxHeight: 480 }, optional: [] } };//Chrome
            }else if(this.getBrowser() == "Firefox"){
                this.constraints = {audio: true,video: {  width: { min: 640, ideal: 640, max: 640 },  height: { min: 480, ideal: 480, max: 480 }}}; //Firefox
            }

        },

        onRender: function() {

            this.constructInteraction();
            this.ui.scrim.hide();
            //this.ui.continueButton.addClass('enabled').removeClass('disabled');

        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');

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
                case 'record':
                    this.onRecordClicked();
                    break;
                case 'stop':
                    this.stopRecording();
                    break;
                case 'download':
                    this.downloadRecording();
                    if (this.downloadMessage != null) {

                        this.showAlert(this.downloadMessage);
                    }
                    break;
                case 'continue':
                    if (this.requireDownload && !this.hasBeenDownloaded) {
                        this.showAlert(this.downloadAlert);
                    } else {
                        this.endInteraction();
                    }
                    break;
            }
        },

        initNavigator: function () {

        },

        onRecordClicked: function () {
            if (typeof MediaRecorder === 'undefined' || !navigator.getUserMedia) {
                alert('MediaRecorder not supported on your browser, use Firefox 30 or Chrome 49 instead.');
            }else {
                this.chunks = [];
                this.startRecording();
                this.ui.vidButtons.removeClass('record playback').addClass('record-active');
                this.ui.rehearseContent.removeClass('playback');
                this.ui.recordIndicator.addClass('active');
                this.startTimer(this.ui.recordIndicator);
            }
        },

        startRecording: function() {

            var self = this;

            if (typeof MediaRecorder.isTypeSupported == 'function'){
                /*
                    MediaRecorder.isTypeSupported is a function announced in https://developers.google.com/web/updates/2016/01/mediarecorder and later introduced in the MediaRecorder API spec http://www.w3.org/TR/mediastream-recording/
                */
                if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                    var options = {mimeType: 'video/webm;codecs=h264'};
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    var options = {mimeType: 'video/webm;codecs=vp9'};
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                    var options = {mimeType: 'video/webm;codecs=vp8'};
                }
                this.log('Using '+options.mimeType);
                this.mediaRecorder = new MediaRecorder(this.stream, options);
            }else{
                this.log('Using default codecs for browser');
                this.mediaRecorder = new MediaRecorder(this.stream);
            }

            this.isRecording = true;
            this.mediaRecorder.start(10);

            this.mediaRecorder.ondataavailable = function(e) {

                self.chunks.push(e.data);
            };

            this.mediaRecorder.onerror = function(e){
                console.log('Error: ', e);
            };


            this.mediaRecorder.onstart = function(){
                self.log('Started & state = ' + self.mediaRecorder.state);
            };

            this.mediaRecorder.onstop = function(){
                self.log('Stopped  & state = ' + self.mediaRecorder.state);
            };

            this.mediaRecorder.onpause = function(){
                self.log('Paused & state = ' + self.mediaRecorder.state);
            }

            this.mediaRecorder.onresume = function(){
                self.log('Resumed  & state = ' + self.mediaRecorder.state);
            }

            this.mediaRecorder.onwarning = function(e){
                self.log('Warning: ' + e);
            };
        },

        stopRecording: function () {
            this.mediaRecorder.stop();
            this.isRecording = false;

            this.ui.recordIndicator.removeClass('active');
            clearInterval(this.timerInterval);
            this.playbackRecording();
        },

        downloadRecording: function () {
            var blob = new Blob(this.chunks, {type: 'video/webm'}),
                url = window.URL.createObjectURL(blob),
                filename = this.model.get('moduleTitle').toLowerCase().trim().replace(/ /g, '_') + '.webm',
                a = document.createElement('a'),
                blob = new Blob(this.chunks, {type: "video/webm"});

            a.style.display = 'none';

            var videoURL = window.URL.createObjectURL(blob);

            a.href = videoURL;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);

            //this.buttonEnable(this.ui.continueButton, true);
            this.hasBeenDownloaded = true;
        },

        playbackRecording: function () {
            var blob = new Blob(this.chunks, {type: "video/webm"});
            //this.chunks = [];

            var videoURL = window.URL.createObjectURL(blob);

            this.recordedVideo.src = videoURL;

            this.log('Recorded Blobs: ');
            this.log(this.chunks);
            this.recordedVideo.controls = true;

            this.ui.rehearseContent.addClass('playback');

            this.ui.vidButtons.removeClass('record-active').addClass('playback');

            this.buttonEnable(this.ui.continueButton, true);
        },

        startTimer: function (display) {
            var start = Date.now(),
                diff,
                minutes,
                seconds,
                self = this;

            function timer() {
                // get the number of seconds that have elapsed since
                // startTimer() was called
                diff = (((Date.now() - start) / 1000) | 0);

                // does the same job as parseInt truncates the float
                minutes = (diff / 60) | 0;
                seconds = (diff % 60) | 0;

                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;

                display.html(minutes + ":" + seconds);

            };
            // we don't want to wait a full second before the timer starts
            timer();
            this.timerInterval = setInterval(timer, 30);
        },

        onCheckboxClicked: function (e) {
            var $box = $(e.currentTarget),
                $input = $box.find('input');

            $input[0].checked = !$input[0].checked;
            vent.trigger('play_sfx', 'button_click');
        },

        constructInteraction: function () {
            // Initialize UI
            this.recordedVideo = this.ui.playbackContainer.find('video')[0];
            this.gumVideo = this.ui.recordContainer.find('video')[0];

            this.gumVideo.controls = false;

            this.ui.playbackContainer.hide();

            this.ui.vidButtons.removeClass('playback').addClass('record');

            // Initialize alert popup
            this.downloadAlert = {
                title: "Download Your Video!",
                body: "<p>Click the download button to download your video before you move on!</p>'"
            }
            this.downloadMessage = this.model.get('downloadMessage') || null;
            var alert = {
                'template': popup_template,
                'showTitle': true,
                'title': 'Download Your Video!',
                'body': '<p>Click the download button to download your video before you move on!</p>',
                'buttons': [{'id': 'ok', 'label': 'OK'}],

                'containerClass': 'alert-popup'
            }
            this.alert = new Popup(alert);
            this.listenTo(this.alert, 'ok:clicked', this.dismissAlert);
            this.ui.alertContainer.append(this.alert.render().el);
            this.ui.scrim.hide();

            // Initialize Navigator

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            navigator.getUserMedia(this.constraints, $.proxy(this.successCallback, this), $.proxy(this.errorCallback, this));
        },

        showAlert: function (msg) {
            this.alert.setText(msg);
            this.alert.$el.fadeIn();
            this.ui.scrim.fadeIn();
        },

        dismissAlert: function () {
            this.alert.$el.fadeOut();
            this.ui.scrim.fadeOut();
        },

        successCallback: function (stream) {
            this.log('getUserMedia() got stream: ', stream);
            this.stream = stream;
            if(!stream.stop && stream.getTracks) {
                stream.stop = function(){
                    this.getTracks().forEach(function (track) {
                        track.stop();
                    });
                };
            }
            if (window.URL) {
                this.gumVideo.src = window.URL.createObjectURL(stream);
            } else {
                this.gumVideo.src = stream;
            }
        },

        errorCallback: function (error) {
            trace('navigator.getUserMedia error: ', error, 6);
        },

        handleSourceOpen: function () {
            this.log('MediaSource opened');
            this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
            this.log('Source buffer: ', this.sourceBuffer);
        },

        handleDataAvailable: function  (event) {
            if (event.data && event.data.size > 0) {
                this.chunks.push(event.data);
            }
        },

        handleStop: function (event) {
            this.log('Recorder stopped: ', event);
        },

        fadeDisplay: function () {
            TweenMax.to(this.ui.displayItem, 0.5, {autoAlpha: 0.0, onCompleteScope: this, onComplete: this.endInteraction});
        },

        stopInteraction: function () {
            this.fadeDisplay();
        },

        endInteraction: function () {
            this.trigger('interaction:complete', this.model);
        },

        log: function(message) {
            trace(message, 6);
        },

        destroy: function () {
            var track;
            if (this.stream) {
                this.stream.stop();
            }

            if (this.isRecording) {
                this.mediaRecorder.stop();
            }

            try {
                this.recordedVideo.stop();
            } catch (e) {
                trace('NO RECORDED VIDEO PLAYING!', this.LOG_LEVEL);
            }

            trace("DESTROY!!", 6);
        },

        getBrowser: function () {
            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browserName  = navigator.appName;
            var fullVersion  = ''+parseFloat(navigator.appVersion);
            var majorVersion = parseInt(navigator.appVersion,10);
            var nameOffset,verOffset,ix;

            // In Opera, the true version is after "Opera" or after "Version"
            if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
                browserName = "Opera";
                fullVersion = nAgt.substring(verOffset+6);
                if ((verOffset=nAgt.indexOf("Version"))!=-1)
                    fullVersion = nAgt.substring(verOffset+8);
            }
            // In MSIE, the true version is after "MSIE" in userAgent
            else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
                browserName = "Microsoft Internet Explorer";
                fullVersion = nAgt.substring(verOffset+5);
            }
            // In Chrome, the true version is after "Chrome"
            else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
                browserName = "Chrome";
                fullVersion = nAgt.substring(verOffset+7);
            }
            // In Safari, the true version is after "Safari" or after "Version"
            else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
                browserName = "Safari";
                fullVersion = nAgt.substring(verOffset+7);
                if ((verOffset=nAgt.indexOf("Version"))!=-1)
                    fullVersion = nAgt.substring(verOffset+8);
            }
            // In Firefox, the true version is after "Firefox"
            else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
                browserName = "Firefox";
                fullVersion = nAgt.substring(verOffset+8);
            }
            // In most other browsers, "name/version" is at the end of userAgent
            else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
                (verOffset=nAgt.lastIndexOf('/')) )
            {
                browserName = nAgt.substring(nameOffset,verOffset);
                fullVersion = nAgt.substring(verOffset+1);
                if (browserName.toLowerCase()==browserName.toUpperCase()) {
                    browserName = navigator.appName;
                }
            }
            // trim the fullVersion string at semicolon/space if present
            if ((ix=fullVersion.indexOf(";"))!=-1)
                fullVersion=fullVersion.substring(0,ix);
            if ((ix=fullVersion.indexOf(" "))!=-1)
                fullVersion=fullVersion.substring(0,ix);

            majorVersion = parseInt(''+fullVersion,10);
            if (isNaN(majorVersion)) {
                fullVersion  = ''+parseFloat(navigator.appVersion);
                majorVersion = parseInt(navigator.appVersion,10);
            }


            return browserName;
        }


    });

});