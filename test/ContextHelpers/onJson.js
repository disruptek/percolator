var should = require('should');
var jbch = require('../../index').onJsonHelper;

// TODO test bad schema, successful schema, json parse error
describe("onJsonHelper", function(){
  it ("sets onJson on the object", function(done){
    var req = {};
    var res = {};
    var handler = {};
    jbch(req, res, handler, function(){
      (typeof req.onJson).should.equal('function');
      done();
    });
  });
  it ("throws an error when called with 2+ params", function(done){
    var handler = {};
    var req = {};
    var res = {};
    jbch(req, res, handler, function(){
      try {
        req.onJson({}, {}, function(err, obj){
          err.should.equal('some error');
        });
      } catch(ex){
        ex.should.equal('req.onJson() was called with the wrong number of properties.');
        done();
      }
    });
  });
  it ("sets the error param when there's an error", function(done){
    var res = {};
    var req = {
      on : function(type, cb){
        switch(type){
          case 'error' : return cb('some error');
          case 'data' : return cb('{"asdf":"asdf"}');
        }
      }
    };
    var handler = {};
    jbch(req, res, handler, function(){
      req.onJson(function(err, obj){
        err.should.equal('some error');
        done();
      });
    });
  });
  it ("sets an obj param when successful", function(done){
    var res = {};
    var req = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb('{"asdf":"asdf"}');
          case 'end' : return cb();
        }
      }
    };
    var handler = {};
    jbch(req, res, handler, function(){
      req.onJson(function(err, obj){
        obj.should.eql({asdf:"asdf"});
        done();
      });
    });
  });
  it ("responds with an error if json doesn't parse", function(done){
    var req = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb('{"age":37,}');
          case 'end' : return cb();
        }
      }
    };
    var handler = {};
    var res = {
              status : {
                badRequest : function(message, detail){
                  message.should.equal('invalid json.');
                  detail.should.equal('{"age":37,}');
                  done();
                }
              }
             };
    jbch(req, res, handler, function(){
      req.onJson(function(err, obj){
        should.fail('should not get here');
      });
    });
  });
  it ("responds with an error if input incorrectly has additional properties", function(done){
    var resumeWasCalled = false;
    var schema = {
             "properties": {
                "age": {
                  "type": "number"
                },
                "name": {
                  "type": "string"
                }
              },
              "additionalProperties" : false
            };
    var req = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb('{"age":37, "name":"GDizzle", "wrong" : "wrong"}');
                          // above mistakenly sends an additional property when
                          // additionalProperties is false
          case 'end' : return cb();
        }
      },
      resume : function(){
        resumeWasCalled = true;
      }
    };
    var handler = {};
    var res = {
        status : {
          badRequest : function(error){
            error.reason.should.equal('json failed schema validation.');
            error.errors[0].message.should.equal('Additional properties are not allowed');
            // detail looks like this:
            // [ { uri: 'urn:uuid:167293d9-3c95-493d-826e-1bfd4146a8b9#',
            // schemaUri: 'urn:uuid:b7e07efd-fd80-4370-8206-9162f4c39cc9#',
            // attribute: 'additionalProperties',
            // message: 'Additional properties are not allowed',
            // details: false } ]
            resumeWasCalled = true;
            done();
          }
        }
    };
    jbch(req, res, handler, function(){
      req.onJson(schema, function(err, obj){
        should.fail('should not get here');
      });
    });
  });
  it ("throws errors when input doesn't match schema", function(done){
    var schema = {
             "properties": {
                "age": {
                  "type": "number"
                },
                "name": {
                  "type": "string"
                }
              }
            };
    var req = {
      on : function(type, cb){
        switch(type){
          case 'data' : return cb('{"age":"37", "name":"GDizzle"}');
                        // mistakenly send age as a string
          case 'end' : return cb();
        }
      }
    };
    var handler = {};
    var res = {
        status : {
          badRequest : function(error){
            error.reason.should.equal('json failed schema validation.');
            error.errors[0].details[0].should.equal('number');
            // detail looks like this:
            // [ { uri: 'urn:uuid:67ef53a9-1b09-48b1-b97d-fae313e4ee39#/age',
            // schemaUri: 'urn:uuid:51edca59-120a-4486-a961-0ee2aa5c276b#/properties/age',
            // attribute: 'type',
            // message: 'Instance is not a required type',
            // details: [ 'number' ] } ]
            done();
          }
        }
    };
    jbch(req, res, handler, function(){
      req.onJson(schema, function(err, obj){
        should.fail('should not get here');
      });
    });
  });
});
