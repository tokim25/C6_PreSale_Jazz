/**
 * Created by jhoffsis on 7/27/15.
 */


define(['backbone', 'app/vent'], function (Backbone, vent) {

    var Model = Backbone.Model.extend({

        defaults: {
            currentSelection: undefined
        },

        //url: 'data/app/menu.json',

        initialize: function(options){
            trace('moduleModel: init()');
            this.app = options.app;
            this.url = options.url;
            this.fetch({
                success: function () {
                    trace('Menu.model.fetch success');
                    this.modelReady();
                }.bind(this),
                error: function (e) {
                    trace('Menu.model.fetch fail');
                    trace(e);
                }
            });

            this.listenTo(vent, 'appModel:role-reset', this.onAppModelReset);
            this.listenTo(vent, 'appModel:submodules-changed', this.update);
            this.listenTo(this.app.model, 'change:lockingMode', this.updateLocking);
        },

        modelReady: function () {

            this.moduleCollection = this.app.model.moduleCollection;
            this.menuItemCollection = this.app.model.menuItemCollection;
            this.updateLocking();
            this.trigger('menumodel:ready');
        },


        update: function () {
            this.updateLocking();
            this.trigger('model:update');
        },

        getNextModule: function (module) {
            var menuItem = module.get('parent'),
                modules = menuItem.get('modules'),
                index = module.get('index'), // position of module in parent collection
                nextModule = modules[index+1],
                newModule;

            if(nextModule) {
                var name = nextModule.moduleName;
                newModule = this.moduleCollection.find(function (module) {
                    return module.get('moduleName') == name;
                })
            }

            return newModule || null;
        },

        onAppModelReset: function () {
            this.moduleCollection = this.app.model.moduleCollection;
            this.menuItemCollection = this.app.model.menuItemCollection;
            this.updateLocking();
            this.trigger('model:reset');
        },

        updateLocking: function () {
            var modules = this.moduleCollection,
                len = modules.length,
                allCompleted = modules.every(function (module) {return module.get('status') == 2;}),
                allButOneCompleted = modules.slice(0, len-1).every(function (module) {return module.get('status') == 2;}),
                firstStarted = modules.findWhere(function (module) {return module.get('status') == 1;}),
                firstNotStarted = modules.findWhere(function (module) {return module.get('status') == 0;}),
                lockingMode = this.app.model.get('lockingMode'),
                unlockPosition = 0; // unlock all items up to this point;

            if (!len) {
                return;
            }
            // only update locking if 'setAllComplete' flag is false; otherwise, locking will be set to false by default for all submodules
            if (this.app.model.get('setAllComplete' )) {
                lockingMode = 'open';
                //unlockPosition = this.moduleCollection.length;
            }

            switch (lockingMode)  {
                case 'none':
                case 'open':
                    unlockPosition = modules.length;
                    break;
                case 'last':
                    var lastButOne = modules.at(len-2);
                    if (lastButOne.get('status') == 2) {
                        unlockPosition = modules.length - 1;
                    } else {
                        unlockPosition = modules.length - 2;
                    }
                    break;
                case 'allButLast':
                    if (allButOneCompleted) {
                        unlockPosition = modules.length - 1;
                    } else {
                        unlockPosition = modules.length - 2;
                    }
                    break;
                case 'linear':
                    if (firstStarted) {
                        unlockPosition = this.moduleCollection.indexOf(firstStarted);
                    } else if (firstNotStarted) {
                        unlockPosition = this.moduleCollection.indexOf(firstNotStarted);
                    } else if (allCompleted) {
                        unlockPosition = this.moduleCollection.length;
                    }
                    break;
                default:
                    trace('ERROR: locking mode "' + lockingMode + '" is not supported', 4);
            }

            this.moduleCollection.each(function (module, i) {
                module.set('locked', i > unlockPosition)
            });

            this.trigger('lockingmode:updated');

        }





    });

    return Model;

});


