/**
 * Created by jhoffsis on 7/13/15.
 */

define(["app/interactions/final_quiz/mainview",
        "ui/splash"],
    function (Quiz, Splash) {
        return Quiz.extend({

            onRender: function () {

                var splashObj = {
                    bg_info: this.model.get('bg_info'),
                    name: this.model.get('name'),
                    modulename: this.model.get('menuModel').get('moduleName').toLowerCase(),
                    template: 'splash',
                    elements: this.model.get('text').splash.slice(),
                    buttons: [{'id': 'continue', 'label': 'Next'}],
                    containerClass: 'splash-popup'
                }
                this.splash = new Splash({model: new Backbone.Model(splashObj)});
                this.ui.splashContainer.append(this.splash.render().el);
                this.listenTo(this.splash, 'splash:complete', this.startInteraction);

                this.ui.popup.addClass('main-popup');

                this.constructInteraction();
            }

        });

    });