/**
 * Created by jhoffsis on 12/18/15.
 */

/**
 * Created by jhoffsis on 10/21/15.
 */


define( ["marionette", "backbone", "text!templates/app/nav/overlays/resourceview.html", "../../vent"], function (Marionette, BackBone, text, vent) {
    var View =  Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            badges: '.badge',
            closeButton: '.close-button'
        },

        events : {
            'click @ui.closeButton': 'onCloseClicked'
        },

        initialize: function (options) {
            trace('badgeview: initialize()');
            this.app = options.app;
            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);
            //this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);


            var self = this,
                ResourceModel = Backbone.Model.extend({

                url: 'data/app/resources.json',

                initialize: function () {
                    this.fetch({
                        success: function () {
                            trace('Nav.model.fetch success');
                            self.modelReady();
                        }.bind(this),
                        error: function (e) {
                            trace('Nav.model.fetch fail');
                            trace(e);
                        }
                    });
                },

                filterGroups: function (role) {
                    var groups = this.get('groups'),
                        filteredGroups = _.filter(groups, function (group) {
                            return group.role == 'all' || group.role.indexOf(role) >-1;
                        });

                    _.each(filteredGroups, function (group) {
                        var links = [];
                        _.each(group.links, function (link) {
                            if (link.role == undefined || link.role.indexOf(role) > -1) {
                                links.push(link);
                            }
                        });
                        group.links = links;
                    });

                    this.set('filteredGroups', filteredGroups);
                }


            });

            this.model = new ResourceModel();
        },

        modelReady: function () {
            var role = this.app.model.get('role');
            this.model.filterGroups(role);
            this.trigger('resourcesview:model-ready');

        },

        onAppModelReset: function () {
            var role = this.app.model.get('role');
            this.model.filterGroups(role);
            this.render();
        },

        onRender: function() {
            trace('Resources: render', 4);

        },

        onCloseClicked: function () {
            this.trigger('close:clicked')
        }
    });

    return View;

});