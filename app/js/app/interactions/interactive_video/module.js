/**
 * Created by jhoffsis on 7/13/15.
 */

define([
    'backbone',
    'marionette',
    'app/vent',
    'app/app',
    'app/interactions/interactive_video/model',
    'app/interactions/interactive_video/mainview',
    'app/interactions/basic_interactions/click_reveal/mainview',
        'text!templates/interactions/basic_interactions/click-reveal/mainview.html',
    'app/interactions/basic_interactions/display/mainview',
        'text!templates/interactions/basic_interactions/display/mainview.html',
    'app/interactions/basic_interactions/text_entry/mainview',
        'text!templates/interactions/basic_interactions/text-entry/mainview.html',
    'app/interactions/basic_interactions/matching/mainview',
    'app/interactions/basic_interactions/matching/model',
        'text!templates/interactions/basic_interactions/matching/mainview.html',
    'app/interactions/basic_interactions/mc_scenario/mainview',
        'text!templates/interactions/basic_interactions/mc-scenario/mainview.html',
    'app/interactions/basic_interactions/multiple_choice/mainview',
    'app/interactions/basic_interactions/multiple_choice/model',
        'text!templates/interactions/basic_interactions/multiple-choice/mainview.html',
    'app/interactions/basic_interactions/sorting/mainview',
        'text!templates/interactions/basic_interactions/sorting/mainview.html'
    ],
    function(
        Backbone,
        Marionette,
        vent,
        app,
        Model,
        MainView,
        ClickReveal,
        template_cr,
        Display,
        template_display,
        TextEntry,
        template_te,
        Matching,
        MatchingModel,
        template_match,
        MCScenario,
        template_scenario,
        MultipleChoice,
        MultipleChoiceModel,
        template_mc,
        Sorting,
        template_sort
    ){

    var Module = Marionette.Object.extend({


        initialize: function (options) {
            this.url = options.url;
            this.menuModel = options.menuModel;
            this.chapter = options.chapter;
        },

        start: function() {
            trace('my custom base_module onStart', 1);

            // create model, passing in url and menu data
            // model calls fetch(), then fires init-complete when data is loaded
            this.model = new Model({url:this.url, menuModel:this.menuModel});
            this.listenTo(this.model, 'model:init-complete', this.onModelLoaded);
        },

        onModelLoaded: function () {
            trace('interactiveVideoModule: onModelLoaded()');
            this.initView();

        },

        initView: function () {
            this.view = new MainView({
                model:this.model,
                interactions: {
                    clickreveal: {
                        view: ClickReveal,
                        template: template_cr
                    },
                    textentry: {
                        view: TextEntry,
                        template: template_te
                    },
                    display: {
                        view: Display,
                        template: template_display
                    },
                    matching: {
                        view: Matching,
                        model: MatchingModel,
                        template: template_match
                    },
                    mcscenario: {
                        view: MCScenario,
                        model: MultipleChoiceModel,
                        template: template_scenario

                    },
                    multiplechoice: {
                        view: MultipleChoice,
                        model: MultipleChoiceModel,
                        template: template_mc
                    },
                    sorting: {
                        view: MultipleChoice,
                        template: template_sort
                    }
                },
                chapter: this.chapter,
                soundPlayer: app.soundPlayer
            });

            this.listenTo(this.view, 'mainview:activity-complete', this.onActivityComplete);
            this.listenTo(this.view, 'mainview:activity-start', this.onActivityStart);
            this.listenTo(this.view, 'mainview:show-conclusion', this.onShowConclusion);
        },

        onShowConclusion: function () {
            vent.trigger('module:show-conclusion');
        },

        onActivityStart: function () {
            vent.trigger('module:start');
        },

        onActivityComplete: function () {
            vent.trigger('module:complete', this.menuModel);
            vent.trigger('module:done');
        },

        onDestroy: function () {
            this.model.destroy();
            this.view.destroy();
        }

    });

    return Module;


});