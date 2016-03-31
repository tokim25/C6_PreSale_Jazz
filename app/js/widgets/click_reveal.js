/**
 * Created by jhoffsis on 8/11/15.
 */


define( ["marionette", "text!templates/widgets/click_reveal.html"], function (Marionette, text) {
    return Marionette.ItemView.extend({

        template : text,

        ui: {
            //
            textbox: '.pt-txt-box'
        },

        initialize: function (options) {
            this.model = model;

        },

        onRender: function() {
            trace('page_turner-textbox: onRender()', 4);


            this.tl = this.createTimeline();

        },


    });

});