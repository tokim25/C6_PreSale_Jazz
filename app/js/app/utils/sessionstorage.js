/**
 * Created by jhoffsis on 12/1/16.
 */


define(['marionette', 'app/vent'], function (Marionette, vent) {

  var Storage = Marionette.Object.extend({
    initialize: function () {
      this.listenTo(vent, 'add-to-storage', this.setItem);
      this.obj = {};
    },

    setItem: function (dottedKeys, val) {
      var obj = this.obj;
      var keys = dottedKeys.split(".");
      var lastKey = arguments.length === 2 ? keys.pop() : false;

      // Walk the hierarchy, creating new objects where needed.
      // If the lastName was removed, then the last object is not set yet:
      for( var i = 0; i < keys.length; i++ ) {
        obj = obj[ keys[i] ] = obj[ keys[i] ] || {};
      }

      // If a value was given, set it to the last name:
      if( lastKey ) {
        obj = obj[ lastKey ] = val;
      }

    },


    getItemByString: function(s) {
      var o = this.obj;
      s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
      s = s.replace(/^\./, '');           // strip a leading dot
      var a = s.split('.');
      for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
          o = o[k];
        } else {
          return;
        }
      }
      return o;
    },

    getStorage: function () {
      return storage;
    }

  });
  return new Storage();
});