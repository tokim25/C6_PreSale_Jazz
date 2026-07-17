/**
 * Created by jhoffsis on 6/30/16.
 */


define( ["marionette", "app/vent", "app/utils/sessionstorage"], function (Marionette, vent, sessionstorage) {
    return Marionette.ItemView.extend({

        name: 'Input',

      ui: {
        //
        radioItemContainer: '.input-radio',
        radioItem: '.input-radio input',
        instrux: '.onscreen-instrux',
        inputContainer: '#input-container',
        continueButton: '#input-view > .continue-button',
        scrim: '.scrim-background'
      },

      events: {
        'click @ui.continueButton': 'onButtonClicked',
        'click @ui.radioItem': 'onInputUpdate'
      },

      initialize: function (options) {
        this.template = options.template;
        this.model = options.model;

      },

      onRender: function() {

        this.ui.scrim.hide();

        this.constructInteraction();

        TweenMax.set(this.ui.inputContainer, {autoAlpha: 0.0});

      },

      startInteraction: function () {
        this.trigger('mainview:activity-start');

        TweenMax.to(this.ui.inputContainer, 0.5, {autoAlpha: 1.0});


      },

      onInputUpdate: function (e) {
        var id = $(e.currentTarget).attr('id');
        var item = _.find(this.model.get('items'), function (item) {
            return item.id == id;
        });
        var val = item.label,
          key = item.key != undefined ? item.key : this.model.get('inputKey');
        sessionstorage.setItem('input.' + this.model.get('moduleName') + '.' + key, val);

        if (val == '') {
          this.buttonEnable(this.ui.continueButton, false);
        } else if (this.ui.continueButton.hasClass('disabled')) {
          this.buttonEnable(this.ui.continueButton, true);
        }
          vent.trigger('play_sfx', 'button_click');

      },


      update: function (index) {
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
      },

      onButtonClicked: function (e) {
        var $button = $(e.currentTarget),
          id = $button.attr('id'),
          dataID = $button.attr('data-id');

        e.stopImmediatePropagation();
        switch(dataID) {
          case 'continue':
            this.endInteraction();

            break;
        }

        return false;
      },


      endInteraction: function () {

        this.trigger('interaction:complete', this.model);
      },

      constructInteraction: function () {

      }


    });

});