/**
 * Created by jhoffsis on 7/26/17.
 */



define([
        "marionette",
        "app/vent",
        "text!templates/interactions/basic_interactions/daci/slack-feedback.html"],
    function (Marionette, vent, text) {
        return Marionette.ItemView.extend({

            template : text,

            ui: {
                headerName: '.slack-center-header-name',
                headerAt: '.header-at',
                slackNode: '.slack-node.template',
                slackInput: '.slack-input span',
                contact: '.slack-contact.enabled',
                messageContainer: '.slack-message-container',
                okButton: '.ok-button',
            },

            events : {
                'click @ui.contact': 'onContactClicked',
                'click @ui.okButton': 'onButtonClicked'
            },

            initialize: function (options) {
                trace('videoview: initialize()');
                this.model = options.model;
                this.controller = options.controller; //reference to mainview.js
                this.numRead = 0;
            },

            onRender: function() {
                this.$('.slack-typing').hide();
                this.buttonEnable(this.ui.okButton, false);
            },

            onContactClicked: function (e) {
                var $contact = $(e.currentTarget),
                    id = $contact.attr('data-id'),
                    contacts = this.model.get('contacts'),
                    contact = _.find(contacts, {id: id});


                if(this.$currentContact) {
                    this.$currentContact.removeClass('current');
                }

                this.ui.headerName.html(contact.name);
                this.ui.headerAt.html('@' + contact.id);
                this.ui.slackInput.html('Message ' + contact.name);

                this.$currentContact = $contact;


                this.numRead ++;

                $contact.addClass('current').removeClass('unread');

                var imgPath = 'assets/images/interactions/slack-images/' + contact.id + '.jpg',
                    $node = this.createMessage(imgPath, contact.name, contact.feedback);

                this.ui.messageContainer.empty();

                this.ui.messageContainer.append($node);

                if (this.numRead >= this.model.get('numTotal')) {
                    this.buttonEnable(this.ui.okButton, true);
                }
            },

            createMessage: function (img, name, body) {
                var $node = this.ui.slackNode.clone();

                $node.removeClass('template');
                $node.find('img').attr('src', img);
                $node.find('.slack-message-name').html(name);
                $node.find('.slack-message-body').html('<p>' + body + '</p>');

                return $node;
            },

            onButtonClicked: function (e) {
                var $button = $(e.currentTarget),
                    id = $button.attr('id'),
                    dataID = $button.attr('data-id');
                switch (dataID) {
                    case 'ok':
                        this.trigger('slackFeedback:complete');
                        break;
                }

                e.stopImmediatePropagation();
                e.preventDefault();

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
            }

        });

    });