/**
 * Created by jhoffsis on 7/10/15.
 */

define (['backbone', 'app/vent'], function(Backbone, vent){
    
    return Backbone.Model.extend({
        
        defaults: {
            name: 'App Model',
            version: 'Design Proof'
        },
        
        url: 'data/app/config.json',
        menuData: null,

        initialize: function (options) {
            // called implicitly
            trace("appmodel: initialize()");
            this.app = options.app;
            this.moduleCollection = new Backbone.Collection();
        },

        init: function() {
            // called explicitly
            trace('appmodel: init()');

            this.fetch({
                success: function () {
                    trace('appModel.fetch success');
                    this.onModelLoaded();
                }.bind(this),

                error: function () {
                    trace('appModel.fetch error');
                }.bind(this)
            })

        },

        onModelLoaded: function () {

            this.trigger('appmodel:loaded');
        },

        loadMenuData: function (role) {
            var menuPath = role != null ? 'menudata-' + role : 'menudata';

            $.ajax({

                url: 'data/app/' + menuPath + '.json',
                dataType: 'json',

                success: function( data ) {
                    this.set('menuData', data);
                    this.onRoleLoaded();
                }.bind(this),

                error: function( data ) {
                    alert( "ERROR:  " + data );
                }.bind(this)
            });
        },

        onMenuDataLoaded: function () {
            this.trigger('appmodel:loaded');
        },

        setRole: function (role, callback, scope) {
            if (callback) {
                this.setRoleCallback = callback;
                this.setRoleScope = scope;
            }
            this.set('role', role);
            this.loadMenuData(role);
        },

        onRoleLoaded: function () {
            var isRoleFiltered = this.get('isRoleFiltered'),
                //key = isRoleFiltered ? 'menu_' + role : 'menu',
                menuData = this.get('menuData');

            //this.set('role', role);
            this.set('menu', menuData.menu);

            var MenuItem = Backbone.Model.extend({
                    defaults: {
                        'id': 0,
                        'name': 'Default Module',
                        'modules': []
                    }
                }),
                MenuItemCollection = Backbone.Collection.extend({model:MenuItem}),
                Module = Backbone.Model.extend({
                    defaults: {
                        'title':'Module 1',
                        'moduleName':'Module1',
                        'moduleType': 'interaction', // interaction | pageturner
                        'modulePath':'interactions/module1/module',
                        'dataPath':'data/interactions/module1.json',
                        'helpType':'module1',
                        'showInMenu': true,
                        'locked': false,
                        'points': 0,
                        'status': 0
                    }
                }),
                ModuleCollection = Backbone.Collection.extend({model:Module}),
                modules = [];

            this.menuItemCollection = new MenuItemCollection(this.get('menu'));
            this.menuItemCollection.each(function (item, i) {
                _.each(item.get('modules'), function (module, j) {
                    module.parent = item;
                    module.index = j;
                    modules.push(new Module(module));
                })
            });

            this.moduleCollection = new ModuleCollection(modules);
            this.moduleCollection.each(function (module, i) {
                module.set('id', i);
            });


            //this.trigger('appModel:role-reset');
            vent.trigger('appModel:role-reset');

            if (this.setRoleCallback) {
                this.setRoleCallback.apply(this.setRoleScope);
                this.setRoleCallback = null;
                this.setRoleScope = null;
            }

        },

        getPercentComplete: function () {
            var items = this.moduleCollection,
                completed = items.filter(function (item) {return item.get('status') == 2;}),
                percentComplete =  Math.floor(completed.length / items.length * 100);

            return percentComplete;
        },

        getStatusString: function () {
            if (this.app.Tracking != undefined) {

              return this.app.Tracking.model.getStatusString();
            }
        },

        getStudentName: function () {
            if (this.app.Tracking != undefined) {

                return this.app.Tracking.model.getStudentName();
            }
        },

        setSubmoduleStatus:function (status) {
            var statusNum;
            switch(status) {
                case 'notstarted':
                    statusNum = 0;
                    break;
                case 'started':
                    statusNum = 1;
                    break;
                case 'completed':
                    statusNum = 2;
                    break;
            }

            this.moduleCollection.each(function (module, i) {
                module.set('status', statusNum);
            });
            vent.trigger('appModel:submodules-changed');
        },

        updateSubmoduleStatus: function (statusString) {
            var statusAr = statusString.split('|'),
                statusNum;
            this.moduleCollection.each(function (module, i) {
                statusNum = parseInt(statusAr[i]);
                if (module.get('status') !== statusNum) {
                    module.set('status', statusNum);
                }

            });
            vent.trigger('appModel:submodules-changed');

        }

    });

});
