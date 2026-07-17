/**
 * Created by jhoffsis on 12/18/15.
 */

/**
 * Created by jhoffsis on 10/21/15.
 */


define( ["marionette", "backbone", "text!templates/app/nav/overlays/helpview.html", "../../vent"], function (Marionette, BackBone, text, vent) {

    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            title: '.help-popup .popup-title',
            body: '.help-popup .popup-body',
            helpContainer: '.help-popup',
            roleContainer: '.role-selection-popup',
            inputRole: '#help-user-role',
            links: '.help-link',
            buttons: '.role-selection-button',
            closeButton: '.close-x-button',
            selectedRole: '#selected-role'
        },

        events : {
            'click @ui.buttons': 'onButtonClicked',
            'click @ui.links': 'onLinkClicked',
            'click @ui.closeButton': 'onButtonClicked'
        },

        title: '',
        body: '',
        buttons: [],
        showTitle: true,
        multipleScreens: false,

        initialize: function (options) {

            trace('popupview: initialize()');
            this.app = options.app;
            var self = this,
                HelpModel = Backbone.Model.extend({

                    url: 'data/app/help.json',

                    initialize: function () {
                        this.fetch({
                            success: function () {
                                trace('Help.model.fetch success');
                                self.modelReady();
                            }.bind(this),
                            error: function (e) {
                                trace('Help.model.fetch fail');
                                trace(e);
                            }
                        });
                    }
                });

            this.model = new HelpModel();

            this.model.set('roleChooser', this.app.model.get('roleChooser') || {roles: []});

            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);

        },

        onRender: function() {
            trace('popupview: onRender()');
            var $button, id, label,
                key, val;

            this.buttons = [{'id': 'close', 'label': ''}];

            _.each(this.buttons, function (button, i) {
                id = button.id, label = button.label,
                    bclass = id != 'close' ? 'popup-button' : 'close-x-button';
                $button = $('<div data-id="' + id + '" class="' + bclass + '">' + label + '</div>');
                this.ui.helpContainer.append($button);
            }.bind(this));

            var JIRAEnabled = this.app.model.get('JIRAEnabled'),
                roleFiltered = this.app.model.get('isRoleFiltered');

            if (!JIRAEnabled && !roleFiltered) {
                this.$el.find('.help-links').remove();
                this.$el.find('.help-hr').remove();
            }
            else if (!JIRAEnabled) {
                this.$el.find('#help-jira').remove();
                this.$el.find('.link-separator').remove();
            }
            else if (!roleFiltered) {
                this.$el.find('#help-role').remove();
                this.$el.find('#role-display').remove();
            }
            this.$el.hide();

            this.onAppModelReset();
            this.ui.roleContainer.hide();
        },

        modelReady: function () {
            this.defaultText = this.model.get('helpText')
        },

        onAppModelReset: function () {
            var role = this.app.model.get('role');
            this.ui.selectedRole.html(role);
        },

        setText: function (textObj) {
            textObj = textObj || this.defaultText;

            var header, body;

            if(_.isArray(textObj)) {
                header = textObj[textObj.length - 1].header;
                body = _.pluck(textObj, 'body').join('');
            } else {
                header = textObj.header;
                body = textObj.body;
            }

            this.ui.title.html(header);
            this.ui.body.html(body);
        },

        commitSelections: function () {
            var role = this.ui.inputRole.val();

            vent.trigger('intro:commit-inputs', {name: '', role: role});

        },

        onButtonClicked: function (e) {
            var $button = $(e.currentTarget),
                id = $button.attr('data-id');

            vent.trigger('play_sfx', 'button_click');

            if(id == 'close') {
                this.trigger('close:clicked');

                return;
            }else if(id === 'submit') {
                this.commitSelections();
            }
            this.ui.helpContainer.fadeIn();
            this.ui.roleContainer.fadeOut();


        },

        onLinkClicked: function (e) {
            var $link = $(e.currentTarget),
                id = $link.attr('data-id');

            if (id === 'jira') {
                vent.trigger('help:' + id);
            } else {
                this.ui.helpContainer.fadeOut();
                this.ui.roleContainer.fadeIn();
            }
        }
    });

});