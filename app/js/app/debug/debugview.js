/**
 * Created by jhoffsis on 2/10/16.
 */


define([
    'marionette',
    'app/vent',
    'text!templates/app/debug/debugview.html',
    '../vent',
    'app/utils/behaviors/hotkeys_behavior'],
    function (Marionette, vent, text, vent, Hotkeys) {
    return Marionette.ItemView.extend({
        template: text,

        ui: {
            closeButton: '.close-x-button',
            status: '#debug-status',
            role: '#debug-user-role',
            links: '.debug-link',
            rows: '.debug-row',
            arrows: '.debug-fold-arrow',
            popup: '.debug-popup',
            toggleAll: '#debug-toggle-all'
        },

        events : {
            'click @ui.links': 'onLinkClicked',
            'click @ui.arrows': 'toggleRow',
            'click @ui.toggleAll': 'toggleAll',
            'click @ui.closeButton': 'onCloseClicked'
        },

        behaviors: {
            Hotkeys: {
                behaviorClass: Hotkeys,
                hotkeys: {
                    'cmd:ctrl:shift:d': 'showDebugger',
                    'ctrl:shift:k': 'showDebugger'
                },
                attachToDocument: true
            }
        },

        initialize: function (options) {
            this.app = options.app;
            this.model = new Backbone.Model();
            var roleChooser = this.app.model.get('roleChooser') || {roles:[]}
            this.model.set('roleChooser', roleChooser);
            this.model.set('version', this.app.model.get('version'));
            this.model.set('appVersion', this.app.model.get('appVersion'));

        },

        onRender: function() {
            this.$el.hide();
            setTimeout(function () {
                this.ui.rows.slideToggle();
            }.bind(this), 500);
            this.ui.popup.draggable();
            this.$el.css('pointerEvents', 'none');
        },

        showDebugger: function(e) {
            this.resetRole();
            this.resetStatus();
            this.$el.fadeIn();
        },

        onCloseClicked: function (e) {
            this.$el.fadeOut();
        },

        toggleRow: function (e) {
            var $arrow = $(e.currentTarget),
                id = $arrow.attr('data-id'),
                $row = this.$('#' + id);
            $row.slideToggle();
            $arrow.toggleClass('expanded');
        },

        toggleAll: function (e) {
            var $button = $(e.currentTarget),
                isOpen = $button.hasClass('expanded');
            if (isOpen) {
                $button.html('Show all');
                this.ui.rows.each(function () {
                    var $row = $(this),
                        id = $row.attr('id'),
                        $arrow = $row.parent().find('[data-id="' + id + '"]');
                    $row.slideUp();
                    $arrow.removeClass('expanded');
                })
            } else {
                $button.html('Hide all');
                this.ui.rows.each(function () {
                    var $row = $(this),
                        id = $row.attr('id'),
                        $arrow = $row.parent().find('[data-id="' + id + '"]');
                    $row.slideDown();
                    $arrow.addClass('expanded');
                })
            }
            $button.toggleClass('expanded');
        },

        resetStatus: function () {
            var statusString = this.app.model.getStatusString();
            this.ui.status.val(statusString);
        },

        setFirstLast: function (pos) {
            var ar = [], collection = this.app.model.moduleCollection,
                len = collection.length, i = 0,
                position = pos === 'first' ? 1 : len - 1,
                val = pos === 'first' ? 1 : 2;
            for (; i<len; i++) {
                if (i<position) {
                    ar.push(val)
                } else {
                    ar.push(0);
                }
            }


            vent.trigger('update-status:submodules', ar.join('|'));
        },

        applyStatusChange:function () {
            var statusString = this.app.model.getStatusString(),
                val = this.ui.status.val(),
                message = 'Status changed.';


            if (statusString === val) {
                message = 'Error: Status string matches the current value.';
            } else if (statusString.length != val.length) {
                message = "Error: The length of the status string doesn't match the original";
            } else if (!this.isValidStatusString(val)) {
                message = "Error: Enter only 0, 1, or 2 as status values";
            } else {
                vent.trigger('update-status:submodules', val);
            }

            alert(message);

        },

        isValidStatusString: function (val) {
            var ar = val.split('|'), i = 0, n;
            for (; i<ar.length; i++) {
                n = parseInt(ar[i]);
                if (n < 0 || n > 2) {
                    return false;
                }
            }
            return true;
        },

        resetRole: function () {
            var role = this.app.model.get('role');
            this.ui.role.val(role);
        },

        commitRole: function () {
            var role = this.ui.role.val();

            vent.trigger('intro:commit-inputs', {name: '', role: role});

        },

        proxyCall: function (funcName, scope, arg) {
            if(this.app.currentModule) {
                try {
                    this.app.currentModule[scope][funcName].apply(this.app.currentModule[scope], arg);
                } catch(error) {
                    trace('Error: ' + error, 5)
                }
            }
        },

        onLinkClicked: function (e) {
            var $link = $(e.currentTarget),
                id = $link.attr('data-id');

            switch (id) {
                case 'notstarted':
                    vent.trigger('set-status:submodules', 'notstarted');
                    break;
                case 'started':
                    vent.trigger('set-status:submodules', 'started');
                    break;
                case 'completed':
                    vent.trigger('set-status:submodules', 'completed');
                    break;
                case 'unlock':
                    vent.trigger('unlock:submodules');
                    break;
                case 'initial':
                    this.setFirstLast('first');
                    break;
                case 'last':
                    this.setFirstLast('last');
                    break;
                case 'apply-status':
                    this.applyStatusChange();
                    break;
                case 'cancel-status':
                    this.resetStatus();
                    break;
                case 'apply-role':
                    this.commitRole();
                    break;
                case 'cancel-role':
                    this.resetRole();
                    break;
                case 'skip-splash':
                    this.proxyCall('startInteraction', 'view');
                    break;
                case 'show-conclusion':
                    this.proxyCall('showConclusion', 'view');
                    break;
                case 'next-ques':
                    this.proxyCall('nextQuestion', 'model', [1]);
                    break;
                case 'prev-ques':
                    this.proxyCall('nextQuestion', 'model', [-1]);
                    break;
                case 'clear-storage':
                    this.app.Tracking.model.clearStorage();
                    break;
                default:

                    break;

            }

            setTimeout(function () {
                this.resetStatus();
            }.bind(this), 500);
        }
    });
});