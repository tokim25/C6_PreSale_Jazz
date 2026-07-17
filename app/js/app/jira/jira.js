/**
 * Created by jhoffsis on 1/12/16.
 */


/**
 * Created by jhoffsis on 10/1/15.
 */


define(['../vent'], function (vent) {
    var Jira = Marionette.Object.extend({
        initialize: function (options) {

            this.url = options.appModule.url;
            this.app = options.app;
            this.appModel = this.app.model;
            this.listenTo(vent, 'help:jira', this.showJira);
            this.listenTo(vent, 'update-jira', this.setJiraValues);
        },

        start: function () {

            var self = this,
                JiraModel = Backbone.Model.extend({

                    url: self.url,

                    initialize: function () {
                        this.fetch({
                            success: function () {
                                trace('Jira.model.fetch success');
                                self.onModelLoaded();
                            }.bind(this),
                            error: function (e) {
                                trace('Jira.model.fetch fail');
                                trace(e);
                            }
                        });
                    }
                });

            this.model = new JiraModel();

        },

        onModelLoaded: function () {
            var key = this.model.get('environment');
            this.jiraVars = this.model.get(key);
            this.jiraTag = this.jiraVars.jiraTag;
            this.component = this.jiraVars.components[this.appModel.get('projectID')]
            this.jiraFile = 'unset';
            this.jiraLocation = 'unset';
            this.jiraItem = 'unset';

            $('body').append('<div id="_JIRA"></div>');
            this.$jira = $('#_JIRA');

            this.setInitialJiraValues();

            this.$jira.html(this.jiraTag);

            vent.trigger('appmodule:ready', this);
        },

        ready: function () {

        },

        setInitialJiraValues: function () {
            var self = this,
                fieldValues = {
                components: this.component,
                    priority: this.jiraVars.priority,
                    description: this.jiraVars.description
            };
            fieldValues['customfield_' + this.jiraVars.version] = this.appModel.get('version');
            fieldValues['customfield_' + this.jiraVars.role] = this.appModel.get('role');
            window.ATL_JQ_PAGE_PROPS =  $.extend(window.ATL_JQ_PAGE_PROPS, {
                fieldValues:fieldValues,
                "triggerFunction": function(showCollectorDialog) {
                    self.showCollectorDialog = showCollectorDialog;
                },
                environment: {
                    //status: this.appModel.getStatusString()
                }
            });
        },

        showJira: function () {
            this.showCollectorDialog();
        },

        setJiraValues: function (obj) {
            var fieldValues = {};
            fieldValues['customfield_' + this.jiraVars.role] = this.appModel.get('role');
            obj = $.extend(obj, {
                status: this.appModel.getStatusString()
            });

            window.ATL_JQ_PAGE_PROPS.environment =  $.extend(window.ATL_JQ_PAGE_PROPS.environment, obj);
            window.ATL_JQ_PAGE_PROPS.fieldValues =  $.extend(window.ATL_JQ_PAGE_PROPS.fieldValues, fieldValues);
            this.cleanJira();
            this.$jira.html(this.jiraTag);
        },

        cleanJira: function () {
              $('.atlwdg-blanket').remove();
              $('.atlwdg-popup').remove();
        }
    });
    return Jira;
});

