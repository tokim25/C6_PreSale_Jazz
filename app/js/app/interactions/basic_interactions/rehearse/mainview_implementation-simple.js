/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent"], function (Marionette, vent) {

    return Marionette.ItemView.extend({

        name: 'Rehearse',

        ui: {
            //
            instrux: '.onscreen-instrux',
            continueButton: '.continue-button',
            rehearseContent: '.rehearse-content',
            recordContainer: '.video-record-container',
            playbackContainer: '.video-playback-container',
            vidButtons: '.video-buttons',
            recordButton: '.video-btn-record',
            stopButton: '.video-btn-stop',
            downloadButton: '.video-btn-download',
            scrim: '.scrim-background'
        },

        events: {
            'click @ui.continueButton': 'onButtonClicked',
            'click @ui.recordButton': 'onButtonClicked',
            'click @ui.stopButton': 'onButtonClicked',
            'click @ui.downloadButton': 'onButtonClicked'
        },

        initialize: function (options) {
            this.template = options.template;
            this.model = options.model;
            this.mediaSource = new MediaSource();
            this.mediaSource.addEventListener('sourceopen', $.proxy(this.handleSourceOpen, this), false);
            this.mediaRecorder;
            this.recordedBlobs;
            this.sourceBuffer;

            this.isRecording = false;

            this.isNavigatorInitted = false;


        },

        onRender: function() {

            this.constructInteraction();
            this.ui.scrim.hide();


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
                    this.startRecording();
                    break;
                case 'stop':
                    this.stopRecording();
                    break;
                case 'download':
                    this.downloadRecording();
                    break;
                case 'continue':
                    this.endInteraction();
                    break;
            }
        },

        initNavigator: function () {

            if (this.isNavigatorInitted) {
                return;
            }

            this.isNavigatorInitted = true;

            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            var constraints = {
                audio: true,
                video: true
            },
                browser = this.getBrowser();

            if(browser == "Chrome"){
                constraints = {audio: true, video: {  mandatory: {  minWidth: 300,  maxWidth: 300, minHeight: 225,maxHeight: 225 }, optional: [] } };//Chrome
            }else if(browser == "Firefox"){
                constraints = {audio: true, video: true}; //Firefox
            }

            navigator.getUserMedia(constraints, $.proxy(this.successCallback, this), $.proxy(this.errorCallback, this));
        },

        startRecording: function() {
            this.initNavigator();

            var options = {mimeType: 'video/webm', bitsPerSecond: 100000};
            this.recordedBlobs = [];
            try {
                this.mediaRecorder = new MediaRecorder(window.stream, options);
            } catch (e0) {
                console.log('Unable to create MediaRecorder with options Object: ', e0);
                try {
                    options = {mimeType: 'video/webm,codecs=vp9', bitsPerSecond: 100000};
                    this.mediaRecorder = new MediaRecorder(window.stream, options);
                } catch (e1) {
                    console.log('Unable to create MediaRecorder with options Object: ', e1);
                    try {
                        options = 'video/vp8'; // Chrome 47
                        this.mediaRecorder = new MediaRecorder(window.stream, options);
                    } catch (e2) {
                        alert('MediaRecorder is not supported by this browser.\n\n' +
                            'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                        console.error('Exception while creating MediaRecorder:', e2);
                        return;
                    }
                }
            }

            console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);

            //TODO handle button states

            this.ui.vidButtons.removeClass('record playback').addClass('record-active');
            this.ui.rehearseContent.removeClass('playback');

            this.mediaRecorder.onstop = $.proxy(this.handleStop, this);
            this.mediaRecorder.ondataavailable = $.proxy(this.handleDataAvailable, this);
            this.mediaRecorder.start(10); // collect 10ms of data
            console.log('MediaRecorder started', this.mediaRecorder);

            this.isRecording = true;
        },

        stopRecording: function () {
            this.mediaRecorder.stop();
            this.isRecording = false;

            console.log('Recorded Blobs: ', this.recordedBlobs);
            this.recordedVideo.controls = true;

            this.ui.rehearseContent.addClass('playback');

            this.ui.vidButtons.removeClass('record-active').addClass('playback');

            this.playbackRecording();
        },

        downloadRecording: function () {
            var blob = new Blob(this.recordedBlobs, {type: 'video/webm'});
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'test.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        },

        playbackRecording: function () {
            var superBuffer = new Blob(this.recordedBlobs, {type: 'video/webm'});
            this.recordedVideo.src = window.URL.createObjectURL(superBuffer);
        },

        constructInteraction: function () {

            this.recordedVideo = this.ui.playbackContainer.find('video')[0];
            this.gumVideo = this.ui.recordContainer.find('video')[0];

            this.ui.playbackContainer.hide();

            this.initNavigator();

            this.ui.vidButtons.removeClass('playback').addClass('record');
        },

        successCallback: function (stream) {
            console.log('getUserMedia() got stream: ', stream);
            window.stream = stream;
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
            console.log('MediaSource opened');
            this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
            console.log('Source buffer: ', this.sourceBuffer);
        },

        handleDataAvailable: function  (event) {
            if (event.data && event.data.size > 0) {
                this.recordedBlobs.push(event.data);
            }
        },

        handleStop: function (event) {
            console.log('Recorder stopped: ', event);
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