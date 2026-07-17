/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    "marionette",
    "app/vent",
    "app/utils/sessionstorage",
    "ui/popup",
    "ui/splash",
    "text!templates/interactions/basic_interactions/pageturner/mainview.html",
    "text!templates/interactions/interactive-module/mainview.html"],
    function (Marionette, vent, sessionstorage, Popup, Splash, pageturnerTemplate, mainTemplate) {
    return Marionette.ItemView.extend({

        name: 'Interactive Module',

        template : mainTemplate,
        model: null,
        interactions: null,
        interaction: null,
        totalItems: 0,
        completedItems: [],
        currentIndex: null,
        currentGoto: null,
        hasSplash: false,
        hasConclusion: false,
        LOG_LEVEL: 10,

        ui: {
            //
            pageturnerContainer: '.pageturner-container',
            splashContainer: '.splash-container',
            conclusionContainer: '.conclusion-container',
            mainContainer: '.main-container',
            interactionContainer: '.interaction-container',

            continueButton: '#interactive-module-view > .continue-button',
            button: '.main-button',
            scrim: '.scrim-background'
        },

        events : {
            'click @ui.continueButton.enabled': 'onButtonClicked'
        },

        initialize: function (options) {
            trace('mainview: initialize()');

            this.model = options.model;
            this.interactions = options.interactions;
            this.chapter = options.chapter;
            this.soundPlayer = options.soundPlayer;
            this.totalItems = this.model.get('interactions').length;
            this.completedItems = [];

            this.currentIndex = null;
            this.interaction = null;

            this.hasSplash = false;
            this.hasConclusion = false;

        },

        onRender: function() {
            this.constructSplash();
            this.constructConclusion();
            this.constructPageturner();

            this.constructInteraction();

            this.ui.scrim.hide();
            this.ui.continueButton.removeClass('enabled').addClass('disabled');

            if (this.hasSplash && this.chapter == null) {
                this.splash.show();
            } else {
                TweenMax.set(this.$el, {autoAlpha: 0.0});
                TweenMax.to(this.$el, 0.5, {autoAlpha: 1.0, onCompleteScope: this, onComplete: this.startInteraction});
            }

        },

        splashComplete: function () {
            this.splash.$el.hide();
            this.startInteraction();
        },

        startInteraction: function () {
            this.trigger('mainview:activity-start');
            if (this.chapter != null) {
                this.createOverlayInteraction(this.chapter);
            } else {
                this.createOverlayInteraction(0);
            }
        },

        getInteraction: function(goto) {
            var obj = {}, interactions = this.model.get('interactions');
            if (_.isNumber(goto)) {
                obj = {intObj: interactions[goto], index: goto};
            } else {
                var intObj = _.find(interactions, function (interaction) {
                    return ( interaction.id == goto)
                });
                obj = {intObj: intObj, index: interactions.indexOf(intObj)};
            }

            return obj;

        },

        createOverlayInteraction: function (goto) {
            var obj = this.getInteraction(goto),
                intObj = obj.intObj,
                index = obj.index,
                type = intObj.type,
                interaction = this.interactions[type],
                model = interaction.model != undefined ? new interaction.model(intObj) : new Backbone.Model(intObj),
                template = interaction.template,
                interactions = interaction.interactions != undefined ? interaction.interactions : this.interactions,
                View = interaction.view;

            this.currentIndex = index;
            this.currentGoto = goto;



            model.set('assetManifest', this.model.get('assetManifest'));
            model.set('moduleName', this.model.get('menuModel').get('moduleName'));
            model.set('moduleTitle', this.model.get('name'));
            if (intObj.storageValues != undefined) {
              _.each(intObj.storageValues, function (obj, i) {
                  var val = sessionstorage.getItemByString(obj.value),
                    prop = model.get(obj.prop),
                    target = obj.target;

                  prop = prop.replace(target, val);

                model.set(obj.prop, prop);
              });
            }

            this.interaction = new View({template: template, model:model, interactions: interactions, soundPlayer:this.soundPlayer});

            this.ui.interactionContainer.empty();
            this.ui.interactionContainer.append(this.interaction.render().el);

            this.listenTo(this.interaction, 'interaction:complete', this.onInteractionComplete);

            if (intObj.conclusion != undefined) {
                this.constructPageConclusion(intObj.conclusion.slice());
            }
            if (intObj.intro != undefined) {
                this.constructPageIntro(intObj.intro.slice());
                this.showPageTurnerIntro();
            } else {

                this.interaction.startInteraction();
            }
        },


        onInteractionComplete: function (model) {

            if (this.pageturnerConcl != undefined) {
                this.showPageTurnerConcl();
            }

            var goto = model.get('goto'),
                interactions = this.model.get('interactions');

            this.update(this.currentIndex);
            if (this.interaction) {
                this.stopListening(this.interaction, 'interaction:complete', this.onInteractionComplete);
                this.destroyOverlayInteraction();
            }

            if (goto != undefined && goto != null && goto != '') {
                this.createOverlayInteraction(goto);
            } else if (this.currentIndex < this.totalItems - 1) {
                this.createOverlayInteraction(this.currentIndex + 1);
            }

        },

        destroyOverlayInteraction: function () {
            this.ui.interactionContainer.empty();
            try {
                this.interaction.destroy();
            } catch (e) {
                trace('ERROR: No destroy() method on interaction!', this.LOG_LEVEL);
            }
            this.interaction = null;
        },

        update: function (index) {

            if (this.completedItems.indexOf(index) < 0) {
                this.completedItems.push(index);
            }

            if (this.isComplete()) {
                var completeOnFinalInteraction = this.model.get('completeOnFinalInteraction');
                if (completeOnFinalInteraction != undefined && completeOnFinalInteraction) {
                    setTimeout(function () {
                        this.completeModule();
                    }.bind(this), 1000);
                } else {

                    this.buttonEnable(this.ui.continueButton, true);
                }
            }
        },

        isComplete: function () {
            return this.completedItems.length == this.totalItems;
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
            switch (dataID) {
                case 'continue':
                    this.completeModule();
            }

            vent.trigger('play_sfx', 'button_click');
        },

        showConclusion: function () {
            this.conclusion.fadeIn();
            this.trigger('mainview:show-conclusion');
        },

        completeModule: function () {
            if (this.hasConclusion) {
                this.showConclusion();
            } else {
                this.endInteraction();
            }
        },

        endInteraction: function () {
            this.trigger('mainview:activity-complete');
        },

        onDestroy: function () {
            //
        },

        constructSplash: function () {
            if (this.model.get('text').splash != undefined) {
                this.hasSplash = true;
                var splashObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'splash',
                    items: this.model.get('text').splash.slice(),
                    buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                }
                this.splash = new Splash({model: new Backbone.Model(splashObj)});
                this.ui.splashContainer.append(this.splash.render().el);
                this.listenTo(this.splash, 'popup:complete', this.splashComplete);
            }
        },

        constructConclusion: function () {
            if (this.model.get('text').conclusion != undefined) {
                this.hasConclusion = true;
                var conclObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'conclusion',
                    badge: this.model.get('menuModel').get('badge'),
                    items: this.model.get('text').conclusion.slice(),
                    buttons: [{'id': 'continue', 'label': 'Continue'}],
                    containerClass: 'splash-popup'
                };

                this.conclusion = new Splash({model: new Backbone.Model(conclObj)});
                this.ui.conclusionContainer.append(this.conclusion.render().el);
                this.listenToOnce(this.conclusion, 'popup:complete', this.endInteraction);
            }
        },

        constructPageturner: function () {

        },

        showPageTurnerIntro: function () {
            this.ui.pageturnerContainer.append(this.pageturnerIntro.render().el);
            this.pageturnerIntro.show();
        },


        showPageTurnerConcl: function () {
            this.ui.pageturnerContainer.append(this.pageturnerConcl.render().el);
            this.pageturnerConcl.show();
        },

        constructPageIntro: function (items) {

            var model = {
                template: pageturnerTemplate,
                items: items,
                buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Continue'}],
                containerClass: 'splash-popup'
            }

            this.pageturnerIntro = new Splash({model: new Backbone.Model(model)});
            this.listenToOnce(this.pageturnerIntro, 'popup:complete', this.endPageturnerIntro);
        },

        endPageturnerIntro: function () {
            this.ui.pageturnerContainer.empty();
            this.pageturnerIntro = null;
            this.interaction.startInteraction();
        },

        constructPageConclusion: function (items) {
            var model = {
                template: pageturnerTemplate,
                items: items,
                buttons: [{'id': 'back', 'label': 'Back'}, {'id': 'continue', 'label': 'Continue'}],
                containerClass: 'splash-popup'
            }

            this.pageturnerConcl = new Splash({model: new Backbone.Model(model)});
            this.listenToOnce(this.pageturnerConcl, 'popup:complete', this.endPageturnerConclusion);

        },

        endPageturnerConclusion: function () {
            var model = this.interaction.model;

            this.ui.pageturnerContainer.empty();
            this.pageturnerConcl = null;

            this.onInteractionComplete(model);
        },

        constructInteraction: function () {

        },
    });

});
