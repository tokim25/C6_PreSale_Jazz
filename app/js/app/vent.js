/**
 * Created with IntelliJ IDEA.
 * User: SamBrick
 * Date: 11/04/2013
 * Time: 15:53
 * To change this template use File | Settings | File Templates.
 */
define(['backbone', 'marionette'],function(Backbone, Marionette){

    var ea = new Backbone.Wreqr.EventAggregator();

    ea.on('all', function (e) {
        trace("[EventAggregator] event: "+e);
    });

    return ea;
});

