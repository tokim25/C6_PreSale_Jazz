/**
 * Created by jhoffsis on 7/10/15.
 */

define( [
    'marionette',
    'app/appmodel',
    'app/vent',
    'app/utils/loadingview',
    'app/utils/utilities',
    'app/utils/preloader',
    'app/utils/soundplayer',
    'text!templates/app/applayout.html'],
    function (
        Marionette,
        AppModel,
        vent,
        LoadingView,
        Utilities,
        Preloader,
        Soundplayer,
        appTemplate) {

    var App = Marionette.Application.extend({

        //vars
        name: 'Application',
        layoutview: null,
        preloader: null,
        soundPlayer: null,
        appModules: [],
        currentMenuItem: null,
        currentModule: null,
        LOG_LEVEL: 5,

        //TODO: auto create conclusion if it is not declared in menu data
        //TODO: enable flag to circumvent role selection and separate menu-data JSONs
        //TODO: enable int-video interactions to fade out for x seconds before being destroyed

        onBeforeStart: function () {

            this.utilities = new Utilities({model: {loggingEnabled: true}});
            //trace('app: #1 onBeforeStart()', this.LOG_LEVEL);
        },

        onStart: function () {
            //trace('app: #1 onStart()', this.LOG_LEVEL);
            this.createRegions();

            this.layoutview.LoadingRegion.empty();

            // Set up preloader and soundplayer instances

            this.preloader = Preloader;
            this.soundPlayer = Soundplayer;

            // Initialize route variables
            this.deepLinkID = null;
            this.deepLinkChapter = null;

            // Initialize model
            this.model = new AppModel({app: this});
            this.model.init();
            this.listenTo(this.model, 'appmodel:loaded', this.onModelLoaded);

            // Set up application level listeners
            this.listenTo(vent, 'appmodule:ready', this.onAppModuleReady);  // fires when each new application level module has loaded its data

            this.listenTo(vent, 'menu:item-selected', this.onMenuItemSelected);
            this.listenTo(vent, 'nav:item-selected', this.onNavItemSelected);

            this.listenTo(vent, 'intro:commit-inputs', this.onInputsCommitted); // fires when user has selected role and entered name, allowing app to commit to LMS
            this.listenTo(vent, 'intro:intro-complete', this.onIntroComplete);  // fires when intro sequence is done, at which point
            this.listenTo(vent, 'intro:intro-complete', this.onIntroComplete);  // fires when intro sequence is done, at which point
                                                                                // app can continue with loading remaining modules and call
                                                                                // startAppModules()

            this.listenTo(vent, 'splash:splash-complete', this.onSplashComplete);

            this.listenTo(vent, 'conclusion:course-complete', this.onCourseComplete); // save data to LMS, close window

            this.listenTo(vent, 'unlock:submodules', this.unlockSubmodules);
            this.listenTo(vent, 'set-status:submodules', this.setSubmoduleStatus);
            this.listenTo(vent, 'update-status:submodules', this.updateSubmoduleStatus);

            // Set up interaction module listeners
            this.listenTo(vent, 'module:ready', this.onModuleReady);        // fires when each new interaction level module has loaded its data
            this.listenTo(vent, 'module:start', this.onModuleStart);        // fires when new interaction has proceeded past the Splash Page to actual interaction
            this.listenTo(vent, 'module:show-conclusion', this.onModuleShowConclusion);        // fires when interaction has proceeded to Conclusion screen
            this.listenTo(vent, 'module:complete', this.onModuleComplete);  // fires when a module has been fully completed
            this.listenTo(vent, 'module:done', this.onModuleDone);

        },

        createRegions: function () {
            var Layout = Marionette.LayoutView.extend({
                el: '#app-container',
                template: appTemplate,
                regions: {
                    MenuRegion: '#menu-container',
                    NavRegion: '#nav-container',
                    IntroRegion: '#intro-container',
                    SplashAnimRegion: '#splash-container',
                    ContentRegion: '#content-container',
                    LoadingRegion: '#loading-container',
                    TARegion: '#ta-container',
                    WinfocusRegion: '#winfocus-container',
                    DebugRegion: '#debug-container'
                }
            });

            this.layoutview = new Layout();
            this.layoutview.render();

        },

        // Main model has loaded;
        onModelLoaded: function () {
            // set any utilities configurations
            var self = this;

            var utilsConfig = this.model.get('utilsConfig');
            this.utilities.configure(utilsConfig);

            // make sure the title is properly displayed
            document.title = this.model.get('projectTitle');
            this.appModules = this.model.get('modules').slice(0);

            if(this.model.get('force3D') != undefined && this.model.get('force3D') == true) {
                CSSPlugin.defaultForce3D = true;
            }

            // if deep linking enabled, set up routing and reset some config settings
            if (this.model.get('allowDeepLinks')) {
                this.model.set('lockingMode', 'open');
                var AppRouter = Backbone.Router.extend({
                    routes: {
                        "module/:id": "getModule",
                        "module/:id/:chapter": "getModuleChapter"
                        // Backbone will try to match the route above first
                    }
                });

                var app_router = new AppRouter;

                app_router.on('route:getModule', function( id ){
                    self.deepLinkID = id;
                   // self.code = code;
                    //trace('app: ROUTE: id/code ' + id + ' / ' + code, this.LOG_LEVEL);
                    trace('ROUTE=> id ' + id, self.LOG_LEVEL);
                });
                app_router.on('route:getModuleChapter', function( id, chapter ){
                    self.deepLinkID = id;
                    self.deepLinkChapter = chapter;
                    trace('ROUTE=>> id/chapter ' + id + ' / ' + chapter, self.LOG_LEVEL);
                });
                // Start Backbone history a necessary step for bookmarkable URL's
                Backbone.history.start();
            }

            this.initAppModule();

        },

        /**
         * APP MODULE INITIALIZATION *
         *
         * Initializes and shows each application level module indicated in config.json
         * ex: Menu | Nav | Help, etc.
         *
         */

        // Initialize each module one at a time
        initAppModule: function() {
            var appModule;

            this.layoutview.LoadingRegion.$el.hide();
            // keep pulling off the array until there are no more
            if(this.appModules.length > 0) {
                appModule = this.appModules.shift();

                // load the module
                require([appModule.path], function (AppModule) {
                    this[appModule.name] = new AppModule({app: this, appModule: appModule}); // create module
                    this[appModule.name].start(); // start the module


                }.bind(this));
            } else {
                // if none left, move on to the next stage
                this.allAppModulesReady();
            }

        },

        // When model is loaded, check to see if the associated module has any assets to load
        onAppModuleReady: function (module) {

            var moduleName = module.options.appModule.name;

            // Do any modle-specific initialization or set-up here...
            switch (moduleName) {
                case 'Tracking':
                    break;
                case 'Debug':
                    break;
                case 'TA':
                    break;
                case 'Jira':
                    break;
                case 'Preloads':
                    break;
                case 'Winfocus':
                    break;
                case 'Soundmap':
                    break;
                case 'Menu':
                    break;
                case 'Nav':
                    break;
                case 'Intro':
                    break;
                case 'SplashAnim':
                    break;

                default:
                    break;
            }
            this.initAppModule();

        },

        // When all he modules are loaded, loop through all modules and show each one that has a show method defined on App
        allAppModulesReady: function () {
            var suspend_data = this.Tracking.getValue('suspend_data'),
                isRoleFiltered = this.model.get('isRoleFiltered'),
                role = isRoleFiltered ? this.model.get('defaultRole') : null;
            ;

            if (suspend_data) {
                if (suspend_data.role && isRoleFiltered) {
                    // Only set a new role if one has been saved
                    role = suspend_data.role;
                }
                this.model.set('name', suspend_data.name);
            }

            // second parameter is async callback;
            // this is necessary because setting role on model will force model to reload menudata-[role].json
            this.model.setRole(role, this.onModelMenuDataLoaded, this);
            //trace('app.allAppModulesReady()', this.LOG_LEVEL);
        },

        onModelMenuDataLoaded: function () {
            var appModules = this.model.get('modules'),
                module,
                assetsToLoad = [];
            _.each(appModules, function (appModule) {
                module = this[appModule.name]
                if(module.model == undefined) return;
                var assets = module.model.get('assetManifest');
                if(assets != undefined && assets.length) {
                    assetsToLoad = assetsToLoad.concat(assets);
                }

            }.bind(this));

            //trace('app.onModelMenuDataLoaded()', this.LOG_LEVEL);

            $('#temp-loading-view').remove();

            if (assetsToLoad.length) {
                this.loadManifest(assetsToLoad, this.onInitialAssetsLoaded);
            } else {
                this.onInitialAssetsLoaded();
            }

        },

        onInitialAssetsLoaded: function () {
            //trace('app.onInitialAssetsLoaded()', this.LOG_LEVEL);
            this.layoutview.LoadingRegion.$el.hide();

            var appModules = this.model.get('modules'),

            // Check for 3 conditions before showing intro:

            // 1) is there actually an intro module?
                introModule = _.find(appModules, function (module) { return module.name == 'Intro';}) || null,

            // 2) if so, is the flag set to show it
                hasIntro = this.model.get('hasIntro'),
                appStatus = this.Tracking.model.getCourseStatus(),

            // 3) is course status 'notStarted' or is flag set to always show intro
                alwaysShowIntro = this.model.get('alwaysShowIntro'),
                showIntro = appStatus == 'notStarted' || alwaysShowIntro,

                hasSplash = this.model.get('showSplashAnim');

            if (hasIntro && showIntro && introModule) { // all 3 conditions are met
                // show intro module only
                this.showModule('Intro');
                this.Jira.setJiraValues({location: 'Intro'});
            } else if (hasSplash) {
                this.showModule('SplashAnim');
            } else {
                // else, retrieve the stored username and role and set them on model,
                // then spool up and show all modules
                this.startAppModules();
            }
        },

        startAppModules: function () {
            var appModules = this.model.get('modules');
            _.each(appModules, function (appModule) {
                if (appModule.name === 'Intro' || appModule.name === 'SplashAnim') {
                    return;
                }
                this[appModule.name].ready();

                if (appModule.name === 'Menu' && this.model.get('hideMenu')) {
                    return;
                }
                this.showModule(appModule.name);

            }.bind(this));
            this.Tracking.model.checkStatus();

            // if url is configured with route, launch the specified module
            //TODO make sure deepLinkID resolves
            if (this.deepLinkID != null) {
                this.onMenuItemSelected(this.deepLinkID);
            }

            // if typical menu-ed course, start menu anthem here
            else if (!this.model.get('viewInteractionAtCourseStart')) {
                this.goToMenu();
            }
            // otherwise, launch the first submodule directly
            else {
                this.launchFirstModule();
            }
            //trace('app.startAppModules()', this.LOG_LEVEL);
        },

        onInputsCommitted: function (inputs) {
            var suspend_data = _.clone(this.Tracking.getValue('suspend_data'));
            if (suspend_data) {
                if(inputs.name != '') {
                    suspend_data.name = inputs.name;
                }
                suspend_data.role = inputs.role;
                this.model.setRole(inputs.role);
                this.model.set('name', inputs.name);
                this.Tracking.setValue('suspend_data', suspend_data);
                this.Tracking.sendData();
            }

        },

        onIntroComplete: function () {
            this.closeModule('Intro');

            this.startAppModules();
            this.Jira.setJiraValues({location: 'Menu'});

        },

        onSplashComplete: function () {
            this.closeModule('SplashAnim');

            this.startAppModules();
            this.Jira.setJiraValues({location: 'Menu'});

        },

        /**
         * INTERACTION MODULE INITIALIZATION *
         *
         * Initializes and shows a single interaction module
         * ex: Menu | Nav | Help, etc.
         *
         */

        // Loads a module
        // accepts an item object from menudata-[role].json
        loadModule: function(item) {
            var name = item.get('moduleName'),
                url = item.get('url'),
                path = item.get('path');

            // if the module doesn't exist, create it
            if (this[name] == undefined) {
                require([path], function (Module) {
                    //module is now loaded.

                    this.currentModule = new Module({url:url, menuModel:item, chapter:this.deepLinkChapter});
                    this.currentModule.start();

                    var soundLoop = item.get('parent').get('soundLoop');
                    if (soundLoop != undefined) {

                        this.soundPlayer.playLoop('loop_' + moduleID);
                    }


                }.bind(this));
            }

            this.Jira.setJiraValues({
                file: url,
                location: name,
                item: 'Intro'
            });

        },

        // fired when a module's data has been loaded
        // checks to see if there are any assets to load
        onModuleReady: function (assetsToLoad) {
            if(assetsToLoad != undefined) {
                this.loadManifest(assetsToLoad, this.onManifestLoaded);
            } else {
                this.onManifestLoaded();
            }

        },

        // load any assets, then fire callback
        loadManifest: function (assetsToLoad, callback) {
            if(assetsToLoad.length) {
                var className = this.currentMenuItem != undefined ? this.currentMenuItem.get('moduleName') : 'main';
                this.layoutview.LoadingRegion.show(new LoadingView({preloader:this.preloader, class: className}));
                this.layoutview.LoadingRegion.$el.show();
                //trace('Start load...', this.LOG_LEVEL);
                this.preloader.preload(assetsToLoad, callback, this);
            } else {
                callback.call(this)
            }

        },

        // callback when an interactions's assets are loaded
        onManifestLoaded: function () {
            this.hideModule('Menu');
            this.showContent();
            //trace('End load...', this.LOG_LEVEL);
            this.layoutview.LoadingRegion.empty();
        },

        // Handler for menu selection
        onMenuItemSelected: function (id) {
            var items = this.Menu.model.moduleCollection,
                item  = items.find(function(item) {
                    return item.get('moduleName') == id;
                });

            this.launchModule(item);

        },

        // launch the very first module
        launchFirstModule: function () {
            var item = this.Menu.model.moduleCollection.at(0);

            this.launchModule(item);
        },

        // Handler for nav selection
        onNavItemSelected: function (id) {
            switch (id) {
                case 'menu':
                    this.destroyModule();
                    this.goToMenu();
                    break;
                case 'help':
                    //trace('show help module');
                    break;
                default:

            }
        },

        launchModule: function (item) {
            this.currentMenuItem = item;

            if(item.get('status') == 0) {
                item.set('status', 1);
                this.Menu.model.update();
            }

            this.loadModule(item);
        },


        /**
         * HANDLERS FOR INTERACTION STATES: START, SHOW CONLUSION, CLOSE & COMPLETION *
         *
         */

        // Interaction has proceeded past Splash Screen
        onModuleStart: function () {
            this.soundPlayer.fadeLoop();
            this.Jira.setJiraValues({
                item: 'Main'
            });
        },

        onModuleShowConclusion: function () {
              var moduleID = this.currentMenuItem.get('parent').get('id'),
                  audioID = 'loop_' + moduleID;

            //this.soundPlayer.playLoop(audioID);
            this.Jira.setJiraValues({
                item: 'Conclusion'
            });
        },

        // Mark completion in LMS
        onModuleComplete: function (menuModel) {
            points = menuModel.get('points') || 0;
            //trace('app: onModuleComplete()', this.LOG_LEVEL);
            if(this.currentMenuItem.get('status') != 2) {
                this.currentMenuItem.set('status', 2);
                this.Menu.model.update();
                //add points to suspend_data obj
                var suspend_data = _.clone(this.Tracking.getValue('suspend_data'));
                if (suspend_data) {
                    if (suspend_data['points'] != undefined) {
                        suspend_data.points += points;
                        this.Tracking.setValue('suspend_data', suspend_data);
                        this.Tracking.sendData();
                    }
                }
            }

        },

        // Module done, but not necessarily completed. Now it can be closed down
        onModuleDone: function () {
            //trace('app: onModuleDone()', this.LOG_LEVEL);
            this.destroyModule();

            var returnToMenu = this.model.get('returnToMenuAfterInteraction'),
                nextModule = this.Menu.model.getNextModule(this.currentMenuItem);

            if (returnToMenu) {
                this.goToMenu();
            } else if (nextModule != null) {
                this.launchModule(nextModule);
            } else {
                // if nextModule, show conclusion??
            }

        },

        onCourseComplete: function () {
            this.Tracking.model.setCourseComplete();
            setTimeout(function () {
                window.close();
            }, 500);
        },

        //
        destroyModule: function () {
            if(this.currentModule != null) {
                this.currentModule.destroy();
                this.currentModule = null;
                this.hideContent();
            }

        },


        // shut down interaction and show menu
        goToMenu: function () {

            //this.showMenu();
            this.showModule('Menu');
            this.soundPlayer.playLoop('loop_menu');
            this.Jira.setJiraValues({
                file: '',
                location: 'Menu'
            });
        },

        /**
         * SHOW / HIDE methods
         */

        showModule: function (moduleName) {
            var module = this[moduleName],
                region = this.layoutview[moduleName + 'Region'],
                moduleview;

            if(region != undefined) {
                moduleview = module.view;

                if (!region.hasView()) {
                    region.show(moduleview);
                } else {
                    region.$el.show();
                    if(moduleName.toLowerCase() === 'menu' || moduleName.toLowerCase() === 'intro') {
                        moduleview.show();
                    }
                }
            }

            vent.trigger(moduleName.toLowerCase() + ':shown');
        },

        hideModule: function (moduleName) {
            var module = this[moduleName],
                region = this.layoutview[moduleName + 'Region'],
                moduleview = module.view;

            region.$el.hide();
            vent.trigger(moduleName.toLowerCase() + ':hidden');
        },

        closeModule: function (moduleName) {
            var module = this[moduleName],
                region = this.layoutview[moduleName + 'Region']

            region.empty();
        },

        showContent: function () {
            this.layoutview.ContentRegion.show(this.currentModule.view);
            this.layoutview.ContentRegion.$el.show();
        },

        hideContent: function () {
            this.layoutview.ContentRegion.$el.hide();
        },

        updateSubmoduleStatus: function (statusString) {
            this.model.updateSubmoduleStatus(statusString);
        },

        setSubmoduleStatus: function (status) {
            this.model.setSubmoduleStatus(status);
        },

        unlockSubmodules: function () {
            this.model.set('lockingMode', 'open');
        }

    });



    return new App();
});