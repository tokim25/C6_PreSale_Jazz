/**
 * Created by jhoffsis on 7/27/15.
 */

define( ['marionette',
        'backbone',
        'app/nav/overlays/helpview',
        'app/nav/overlays/badgeview',
        'app/nav/overlays/resourcesview',
        'app/nav/overlays/progressview',
        'app/nav/overlays/soundview',
        'text!templates/app/nav/navview.html',
        'app/vent'],
    function (Marionette, BackBone, HelpView, BadgeView, ResourcesView, ProgressView, SoundView, text, vent) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            navButton: '.nav-button',
            progressButton: '.progress-ibutton',
            soundButton: '.sound-ibutton',
            muteButton: '.mute-ibutton',
            badgeButton: '.badge-ibutton',
            tooltip: '.nav-tooltip',
            infoButton: '.info-ibutton',
            infoContainer: '.nav-info-container',
            slideoutContainer: '.nav-slideout-container',
            slideoutView: '.slideout-view',
            badgeView: '.badge-container',
            progressView: '.progress-container',
            resourcesView: '.resources-container',
            soundView: '.sound-container'
        },
        
        events : {
            'click @ui.navButton.enabled': 'onButtonClicked',
            'mouseover @ui.navButton.enabled': 'onButtonOver',
            'mouseleave @ui.navButton.enabled': 'onButtonLeave',
            'click @ui.infoButton': 'onInfoButtonClicked'
        },

        infoOpen: false,
        infoMode: false,

        initialize: function (options) {
            trace('navview: initialize()');

            this.app = options.app;


            this.model = options.model;
            this.trackingModel = options.trackingModel;

            this.infoOpen = false;
            this.infoMode = false;

            this.listenTo(vent, 'trackingmodel:change-suspend_data', this.onSuspendDataChanged);

            //this.listenTo(vent, 'trackingmodel:status-changed', this.updateProgress);
            this.listenTo(this.app.model.moduleCollection, 'change', this.updateProgress);

            this.listenTo(vent, 'module:ready', this.onModuleReady);
            this.listenTo(vent, 'module:complete', this.onModuleComplete);
            this.listenTo(vent, 'module:start', this.onModuleStart);
            this.listenTo(vent, 'global:show-info', this.onShowInfo);
            //this.listenTo(vent, 'module:show-conclusion', this.hideInfoButton);

            //interval id for closing overlay after 2 seconds
            this.closeOverlay_id = 0;

        },

        onRender: function() {
            trace('navview: onRender()', 1);

            this.badgeview = new BadgeView({app: this.app});
            this.ui.badgeView.append(this.badgeview.render().el);

            this.resourcesview = new ResourcesView({app: this.app});
            this.listenTo(this.resourcesview, 'resourcesview:model-ready', this.onResourcesReady);


            this.soundview = new SoundView({app: this.app});
            this.ui.soundView.append(this.soundview.render().el);

            this.progressview = new ProgressView({app: this.app});
            this.ui.progressView.append(this.progressview.render().el);

            this.infoPopup = new HelpView({app: this.app});
            this.listenTo(this.infoPopup, 'close:clicked', this.hideInfo);

            this.listenTo(this.badgeview, 'close:clicked', this.hideOverlay);
            this.listenTo(this.soundview, 'close:clicked', this.hideOverlay);
            this.listenTo(this.resourcesview, 'close:clicked', this.hideOverlay);
            this.listenTo(this.progressview, 'close:clicked', this.hideOverlay);


            this.ui.infoContainer.append(this.infoPopup.render().el);
            this.infoPopup.$el.show();
            this.ui.infoContainer.hide();

            this.onSuspendDataChanged(this.trackingModel.getValue('suspend_data'));

            this.$win = $(window);
            this.$win.on('resize', $.proxy(this.onResize, this));

            this.ui.slideoutView.hide();

            setTimeout(function () {
                this.onResize();
                this.updateProgress();
                this.ui.slideoutView.show();
            }.bind(this), 200);

            this.ui.muteButton.hide();
            this.soundview.toggleSound(true);
            this.onButtonLeave();
        },

        onResourcesReady: function () {
            this.ui.resourcesView.append(this.resourcesview.render().el);
        },


        onResize: function () {
            var slideViewWidth = this.ui.slideoutContainer.width();
            /*this.ui.badgeView.width(slideViewWidth);
            this.ui.progressView.width(slideViewWidth);
            this.ui.resourcesView.width(slideViewWidth);
            this.ui.soundView.width(slideViewWidth);*/

            this.ui.slideoutView.width(slideViewWidth);
        },

        onButtonOver: function (e) {
            if(this.$currentButton) {
                TweenMax.killTweensOf(this.ui.tooltip);
                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
            }
            var $button = $(e.currentTarget),
                label = $button.attr('data-tooltip'),
                xTooltip = $button.position().left + 20,
                p = this.ui.tooltip.find('p');

            p.html(label);
            this.$currentButton = $button;

            if ($button.hasClass('info-ibutton')) {
                TweenMax.set(this.ui.tooltip, {autoAlpha: 1.0});
                xTooltip -= p.width();
                TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
            }


            this.ui.tooltip.css('left', xTooltip);

            TweenMax.to(this.ui.tooltip, 0.3, {delay: 0.5, autoAlpha:1.0});
            TweenMax.to(this.ui.tooltip, 0.3, {delay: 5.0, autoAlpha:0.0});

        },

        onButtonLeave: function () {
            TweenMax.killTweensOf(this.ui.tooltip);
          if(this.$currentButton) {
              TweenMax.to(this.ui.tooltip, 0.3, {autoAlpha: 0.0, onComplete: function () {this.$currentButton = null;}.bind(this)});
          } else {
              TweenMax.set(this.ui.tooltip, {autoAlpha: 0.0});
          }
        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            clearInterval(this.closeOverlay_id);
            this.onButtonLeave();

            if(id === 'info') {
                return;
            }

            this.hideOverlay();

            this.ui.navButton.removeClass('selected');

            vent.trigger('play_sfx', 'button_click');

            this.hideInfo();

            this.trigger('navview:item-selected', id);

            if(id === 'menu') {
                this.$('#nav-view').removeClass();
                this.currentID = '';
                this.$currentOverlay = null;
                this.currentModule = null;
                return;
            }

            if(this.currentID == id) {
                this.currentID = '';
                return;
            }


            switch (id) {
                case 'menu':

                    break;
                case 'badges':

                    break;
                case 'resources':

                    break;
                case 'progress':
                    clearInterval(this.closeOverlay_id);
                    this.autoHideOverlay(2000);
                    break;
                case 'sound':
                    this.soundview.toggleSound(false);
                    this.ui.soundButton.hide();
                    this.ui.muteButton.show();
                    $button = this.ui.muteButton;
                    this.app.soundPlayer.soundOff();
                    clearInterval(this.closeOverlay_id);
                    this.autoHideOverlay(2000);
                    break;
                case 'mute':
                    this.soundview.toggleSound(true);
                    this.ui.soundButton.show();
                    this.ui.muteButton.hide();
                    this.app.soundPlayer.soundOn();
                    id = 'sound';
                    clearInterval(this.closeOverlay_id);
                    this.autoHideOverlay(2000);

                break;
                case 'info':

                    break;
            }

            this.currentID = id;
            $button.addClass('selected');

            this.$currentOverlay = this.ui[id + 'View'];
            this.showOverlay();

        },

        autoHideOverlay: function (time) {
            trace("AutoHideOverlay(): " + time, 6)
            this.ui.navButton.removeClass('enabled');
            this.closeOverlay_id = setInterval(function () {
                this.hideOverlay();
                this.ui.navButton.addClass('enabled');
                this.currentID = '';
                clearInterval(this.closeOverlay_id);
            }.bind(this), time);
        },

        hideOverlay: function (delay) {
            if (!this.$currentOverlay) {
                //this.hideInfoButton();
                return;
            } else {
                this.showInfoButton();
            }

            delay = delay || 0;
            TweenMax.to(this.$currentOverlay, 0.3, {delay: delay, left: '-100%', ease: Power4.easeIn});
            this.ui.navButton.removeClass('selected');
            this.$currentOverlay = null;
        },


        showOverlay: function (id) {
            if (!this.$currentOverlay) {
                return;
            }
            this.hideInfoButton();
            TweenMax.to(this.$currentOverlay, 0.5, {left: '0%', ease: Power4.easeOut});
        },

        hideMenuButton: function (e) {
            this.ui.menuButton.hide();
        },

        showMenuButton: function (e) {
            this.ui.menuButton.show();
        },

        updateProgress: function () {
            var percentComplete = this.app.model.getPercentComplete();
            this.ui.progressButton.html(percentComplete + '%');
        },

        onModuleReady: function () {
              this.currentModule = this.app.currentModule;
              var moduleClass = this.currentModule.model.get('menuModel').get('moduleName');
              this.$('#nav-view').addClass(moduleClass);
        },

        onModuleComplete: function (module) {

            var badge = module.get('badge') || null;

          /*var moduleClass = this.currentModule.model.get('menuModel').get('moduleName');
          this.$('#nav-view').addClass(moduleClass);*/
            this.$('#nav-view').removeClass();

            this.currentModule = null;

            if (badge == null) {
                return;
            }

            this.infoMode = false;
            //this.hideInfoButton();
            this.hideOverlay();

            //TODO: fix this!

            this.$currentOverlay = this.ui.badgeView;
            this.ui.navButton.removeClass('enabled');
            this.ui.badgeButton.addClass('selected');
            this.showOverlay();

            setTimeout(function (module) {
                this.badgeview.showBadge(badge);
            }.bind(this), this.model.get('badgeShowDelay'));
            clearInterval(this.closeOverlay_id);
            this.autoHideOverlay(this.model.get('badgeHideDelay'));
        },

        onModuleStart: function () {
            //this.showInfoButton();
            this.infoMode = true;
        },

        onInfoButtonClicked: function () {
            var $info, textObj;

            if (this.infoOpen) {
                this.hideInfo();
                return;
            }
            if(this.currentModule
                && this.currentModule.model.get('text')
                && this.currentModule.model.get('text').splash) {
                textObj = this.currentModule.model.get('text').splash;


            } else {
                textObj = null;
            }

            this.infoPopup.setText(textObj);


            this.showInfo();

            vent.trigger('play_sfx', 'button_click');

        },

        hideInfoButton: function () {
            //this.ui.infoButton.hide();
            this.hideInfo();
        },

        showInfoButton: function () {
            this.ui.infoButton.fadeIn(1000);
        },

        hideInfo: function () {
            this.infoOpen = false;
            this.ui.infoContainer.fadeOut();
        },

        showInfo: function () {
            this.infoPopup.$el.show();
            this.infoOpen = true;
            this.ui.infoContainer.fadeIn();
        },

        onShowInfo: function (textObj) {
            this.infoPopup.setText(textObj);
            this.showInfo();
        },

        onSuspendDataChanged: function (suspend_data) {
            var points = suspend_data.points;
            //this.ui.navScore.html(points);
        }
    });

});