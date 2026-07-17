/**
 * Created by jhoffsis on 6/30/16.
 */


/**
 * Created by jhoffsis on 7/13/15.
 */

define(["marionette",
    "app/vent"],
  function (Marionette, vent) {
    return Marionette.ItemView.extend({

      name: 'Sorting',

      ui: {
        //
        textbox: '.popup-text-box',
        instrux: '.onscreen-instrux',
        draggables: '.drag-item',
        droppables: '.drag-target',
        dragContainer: '.drag-container',
        dropContainer: '.target-container',
        okButton: '.ok-button',
        scrim: '.scrim-background'
      },

      events: {
        'click @ui.okButton': 'onFeedbackDismissed'
      },

      initialize: function (options) {
        this.template = options.template;
        this.model = options.model;
        this.model.set('items', _.shuffle(this.model.get('items')));
        this.listenTo(this.model, 'model:update', this.onModelUpdate)
        trace('mainview: initialize()');

      },

      onRender: function () {
        trace('mainview: onRender()');

        //setTimeout(function () {
        this.constructInteraction();
        //}.bind(this), 500);

        this.ui.scrim.hide();
        TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});
        TweenMax.set(this.ui.instrux, {autoAlpha: 0.0});


      },

      startInteraction: function () {
        TweenMax.to(this.ui.instrux, 0.7, {autoAlpha: 1.0});
        this.nextItem();
      },

      nextItem: function () {
        var index = this.model.index,
          $drag = this.ui.dragContainer.find('[data-index="drag-' + index + '"]');
        TweenMax.set($drag, {marginLeft: -1500, autoAlpha: 1.0});
        TweenMax.to($drag, 0.5, {delay: 1.0, marginLeft: 0.0});
      },

      onModelUpdate: function (complete) {
        if (!complete) {
          this.nextItem();
        } else {
          var fb = this.model.get('feedback');

          if (fb.final != undefined) {
              var content = this.model.get('feedback').final,
                  feedbackObj = {
                      header: '<h2>' + content.title + '</h2>',
                      body: '<p>' + content.body + '</p>'
                  };
              this.showFeedback(feedbackObj);
          } else {
            setTimeout(function () {
                this.endInteraction();
            }.bind(this), 1500)

          }

        }
      },

      onFeedbackDismissed: function () {
        TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 0.0, onComplete: this.endInteraction, onCompleteScope: this});
      },

      showFeedback: function (content) {
        this.ui.textbox.find('.content').html(content.header + content.body);
        TweenMax.set(this.ui.textbox, {autoAlpha: 0.0});

        TweenMax.to(this.ui.textbox, 0.5, {autoAlpha: 1.0});

      },

      resetDrags: function () {
        this.model.resetCount();
        this.ui.draggables.each(function () {
          TweenMax.set($(this), {autoAlpha: 0});
        });
        this.ui.droppables.each(function () {
          var $drop = $(this);
          $drop.find('.content').empty();
        });

        this.ui.undoButton.hide();
      },

      resetDrag: function ($drag, duration, hideDrag) {
        TweenMax.to($drag, duration, {
          'top': $drag.data('top'),
          'left': $drag.data('left'),
          onComplete: function () {
            if (hideDrag) {
              TweenMax.set($drag, {autoAlpha: 0});
            }
          }
        })
      },

      endInteraction: function () {
        this.trigger('interaction:complete', this.model);
      },

      constructInteraction: function () {
        var self = this,
          tolerance = this.model.get('tolerance') != undefined ? this.model.get('tolerance') : 'intersect';

        this.ui.draggables.each(function () {
          var $this = $(this),
            pos = $this.position();
          $this.data('top', pos.top);
          $this.data('left', pos.left);
        });

        this.ui.draggables.draggable({
          revert: function () {
            var $this = $(this);
            TweenMax.to($this, 0.3, {left: $this.data('left'), top: $this.data('top'), ease: Circ.easeOut});
            return false;
          },
          zIndex: 100,
          start: function (event, ui) {
            $(this).addClass('dragging');
          },
          stop: function (event, ui) {$(this).removeClass('dragging');}
        }).css("position", "absolute");

        this.ui.droppables.droppable({
          drop: function (e, ui) {
            var $drag = ui.draggable,
              $drop = $(this),
              dragID = $drag.attr('data-id'),
              dragIndex = parseInt($drag.attr('data-indexid')),
              dropID = $drop.attr('data-id'),
              duration = 0.3,
              hideDrag = false,
              dragModel = self.model.getByIndex(dragIndex),
              description = dragModel.label != undefined ? dragModel.label : dragModel.text,
              $description = '<p class="sorting-description">' + description + '</p>';

            if (dragID === dropID) {
              $drop.find('.content').append($description);
              duration = 0.0;
              hideDrag = true;
              self.model.updateCompleted();
              vent.trigger('play_sfx', 'drag_drop');
            } else {
              vent.trigger('play_sfx', 'drag_incorrect');
            }

            self.resetDrag($drag, duration, hideDrag);


          },
          tolerance: tolerance,
          hoverClass: 'active',
          accept: '.drag-item'
        });

        TweenMax.set(this.ui.draggables, {autoAlpha: 0});
      }
    });

  });