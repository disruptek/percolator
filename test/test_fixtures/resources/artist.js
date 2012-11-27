var JsonModule = require('../../../index').JsonModule;
_ = require('underscore');

module.exports = new JsonModule({

  schema : {
    description : "A musical artist",
    type : "object",
    properties : {
      name : {
        title : "The artist's name",
        type : "string",
        required : true
      }
    }
  },

  create : function($, obj, cb){
    console.log('creating: ', obj);
    obj.created = new Date();
    var newKey = parseInt(_.max(_.keys($.app.artists)), 10) + 1;
    $.app.artists[newKey] = obj;
    cb();
  },

  update : function($, id, obj, cb){
    console.log('updating: ', id, obj);
    $.app.artists[id] = obj;
    cb();
  },

  destroy : function($, id, cb){
    delete $.app.artists[id];
    cb();
  },

  list : function($, cb){
    cb(null, $.app.artists);
  },

  fetch : function($, id, cb){
    var row = $.app.artists[id];
    console.log("row was: ", row);
    if (!!row){
      cb(null, row);
    } else {
      cb(true);
    }
  }

});




