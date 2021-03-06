var should = require('should');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var Percolator = require('../index').Percolator;
var port = 9000;
var server;


describe('Percolator', function(){
  describe("when parseBody is false", function(){
    beforeEach(function(done){
      server = new Percolator({port : port});
      server.listen(done);
    });
    afterEach(function(done){
      server.close(done);
    });

    it("has default error handlers for 404s", function(done){
        var that = this;
        var url = "http://localhost:" + port + "/DOES_NOT_EXIST";
        server.route('/', {  GET : function(req, res){
                                                 res.end("Hello World!");
                                               }});
        hottap(url).request("GET",
                                 function(err, response){
                                   response.status.should.equal(404);
                                   JSON.parse(response.body).error.type.should.equal(404);
                                   should.not.exist(err);
                                   done();
                                 });
    });
    it("has default error handlers for 405s", function(done){
        var that = this;
        var url = "http://localhost:" + port + "/";
        server.route('/', {  GET : function(req, res){
                                                 res.end("Hello World!");
                                               }});
        hottap(url).request("DELETE",
                                 function(err, response){
                                   response.status.should.equal(405);
                                   JSON.parse(response.body).error.type.should.equal(405);
                                   should.not.exist(err);
                                   done();
                                 });
    });
    it("has default error handlers for 501s", function(done){
        var that = this;
        var url = "http://localhost:" + port + "/";
        server.route('/', {  GET : function(req, res){
                                                 res.end("Hello World!");
                                               }});
        hottap(url).request("TRACE",
                                 function(err, response){
                                   response.status.should.equal(501);
                                   JSON.parse(response.body).error.type.should.equal(501);
                                   should.not.exist(err);
                                   done();
                                 });
    });
    it("has a default error handler for 414s", function(done){
        var that = this;
        var bigpath = "1";
        _.times(4097, function(){bigpath += '1';});
        var url = "http://localhost:" + port + "/" + bigpath;
        server.route('/', {  GET : function(req, res){
                                                 res.end("Hello World!");
                                               }});
        hottap(url).request("GET",
                                 function(err, response){
                                   response.status.should.equal(414);
                                   JSON.parse(response.body).error.type.should.equal(414);
                                   should.not.exist(err);
                                   done();
                                 });
    });

    it ("exposes a before hook for executing logic before requests", function(done){
      var that = this;
      var url = "http://localhost:" + port + "/";
      server.route('/', {  GET : function(req, res){
                                               res.end("Hello World! " + req.decorated);
                                             }});
      server.before(function(req, res, handler, cb){
        req.url.should.equal('/');
        req.decorated = true;
        cb(req, res);
      });
        hottap(url).request("GET",
                                 function(err, response){
                                   response.status.should.equal(200);
                                   response.body.should.equal("Hello World! true");
                                   done();
                                 });
    });

    it ("exposes an after hook for executing logic after requests", function(done){
      var that = this;
      var responded = false;
      var url = "http://localhost:" + port + "/";
      server.route('/', {  GET : function(req, res){
                                               res.end("Hello World!");
                                             }});
      server.after(function(req, res){
        req.url.should.equal('/');
        done();
      });
        hottap(url).request("GET",
                                 function(err, response){
                                   responded = true;
                                   response.status.should.equal(200);
                                   response.body.should.equal("Hello World!");
                                 });
    });

    it ("can respond to simple requests", function(done){
      var that = this;
      server.route('/', {  GET : function(req, res){
                                               res.end("Hello World!");
                                             }});
        var url = "http://localhost:" + server.port + "/";
        hottap(url).request("GET",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    response.status.should.equal(200);
                                    done();
                                 });
    });

    it ("passes options on to the req's 'app' namespace", function(done){
      server.route('/', {  GET : function(req, res){
                                               should.exist(req.app);
                                               req.app.port.should.equal(port);
                                               res.end("Hello World!");
                                             }});
        var url = "http://localhost:" + port + "/";
        hottap(url).request("GET",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    response.status.should.equal(200);
                                    done();
                                 });
    });

    it ("adds a router reference to every req", function(done){
        server.route('/', {  GET : function(req, res){
                                                 should.exist(req.router);
                                                 res.end("added router!");
                                               }});
        var url = "http://localhost:" + port + "/";
        hottap(url).request("GET",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    response.status.should.equal(200);
                                    response.body.should.equal('added router!');
                                    done();
                                 });
    });

    it ("HEAD for a GET-only resource returns the same headers, blank resource", function(done){
      server.route('/', {  GET : function(req, res){
                                         res.setHeader('Content-Type', 'text/plain');
                                         res.end('yo yo yo');
                                       }});
        var url = "http://localhost:" + port + "/";
        hottap(url).request("HEAD", 
                                 function(err, response){
                                   if (err) {
                                     throw err;
                                   }
                                   response.headers['content-type'].should.equal('text/plain');
                                   response.body.should.equal("");
                                   response.status.should.equal(204);
                                   done();
                                 });
    });

    it ("OPTIONS for a GET-only resource returns, GET, HEAD, OPTIONS", function(done){
      server.route('/', {  GET : function(req, res){
                                               res.end("Hello World!");
                                             }});
        var url = "http://localhost:" + port + "/";
        hottap(url).request("OPTIONS",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    var body = JSON.parse(response.body);
                                    body['allowed methods'].should.eql(["OPTIONS","HEAD","GET"]);
                                    response.headers.allow.should.equal('OPTIONS,HEAD,GET');
                                    response.status.should.equal(200);
                                    done();
                                 });
    });

    describe('when managing a text/plain body', function(){
      it ("parsed body gets returned in onBody", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    POST : function(req, res){
                                      req.onBody(function(err, body){
                                        body.should.equal('wakka wakka wakka');
                                        res.end("Hello World!");
                                      });
                                    }});
          hottap("http://localhost:" + port + "/").request("POST", 
                                                   {"content-type":"text/plain"},
                                                   'wakka wakka wakka',
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(200);
                                                      response.body.should.equal("Hello World!");
                                                      done();
                                                   });
      });
    });
    describe('when managing an application/json body', function(){
      it ("parsed body gets returned in onJson", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    POST : function(req, res){
                                      req.onJson(function(err, body){
                                        should.exist(body.tests);
                                        should.exist(body.tests2);
                                        body.tests.length.should.equal(162);
                                        res.end("Hello World!");
                                      });
                                    }});
          var largerJson = {
            "tests" : [
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test"
            ],
            "tests2" : [
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test",
              "test", "test", "test", "test", "test", "test", "test", "test", "test"
            ],
          };
          hottap("http://localhost:" + port + "/").request("POST",
                                                   {"content-type":"application/json"},
                                                   JSON.stringify(largerJson),
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(200);
                                                      response.body.should.equal("Hello World!");
                                                      done();
                                                   });
      });
    });
    it ("parsed body gets returned in onJson even when stream processing is delayed", function(done){
      this.timeout(5000);
      server.route('/', {

        authenticate : function(req, res, cb){
          setTimeout(function(){
            cb();
          }, 4000);
        },

        GET : function(req, res){
                                    res.end("Hello World!");
                                  },

                                  POST : function(req, res){
                                    req.onJson(function(err, body){
                                      should.exist(body.tests);
                                      body.tests.length.should.equal(18);
                                      res.end("Hello World!");
                                    });
                                  }});
        var largerJson = {
          "tests" : [
            "test", "test", "test", "test", "test", "test", "test", "test", "test",
            "test", "test", "test", "test", "test", "test", "test", "test", "test",
          ]
        };
        hottap("http://localhost:" + port + "/").request("POST",
                                                 {"content-type":"application/json"},
                                                 JSON.stringify(largerJson),
                                                 function(err, response){
                                                    if (err) {
                                                      throw err;
                                                    }
                                                    response.status.should.equal(200);
                                                    response.body.should.equal("Hello World!");
                                                    done();
                                                 });
    });
  });


  describe("when staticDir is set", function(){
    beforeEach(function(done){
      var staticDir = __dirname + '/test_fixtures/static';
      server = new Percolator({port : port, staticDir : staticDir});
      server.listen(done);
    });
    afterEach(function(done){
      server.close(done);
    });
    // pending due to static resource use
    it ("can respond to static requests", function(done){
      server.route('/', {  GET : function(req, res){
                                               res.end("Hello World!");
                                             }});
        var url = "http://localhost:" + server.port + "/static.txt";
        hottap(url).request("GET",
                                 function(err, response){
                                    if (err) {
                                      throw err;
                                    }
                                    response.status.should.equal(200);
                                    response.body.should.equal("Yep.\n");
                                    done();
                                 });
    });
  });


  describe("when staticDir is set to a non-existant dir", function(){
    afterEach(function(done){
      server.close(done);
    });
    it ("returns an error.", function(done){
      var staticDir = __dirname + '/test_fixtures/NO_EXIST';
      server = new Percolator({port : port, staticDir : staticDir});
      server.listen(function(err){
        if (err) {
          err.should.equal("Your staticDir path could not be found.");
          done();
        }
      });
    });
  });

  describe("when parseBody is true", function(){
    beforeEach(function(done){
      server = new Percolator({port : port, parseBody : true});
      server.listen(done);
    });
    afterEach(function(done){
      server.close(done);
    });
    describe('when managing a json body', function(){
      it ("parsed body gets added to the req", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    PUT : function(req, res){
                                      req.body.thisisa.should.equal('TEST');
                                      req.rawBody.should.equal('{"thisisa":"TEST"}');
                                      res.end("Hello World!");
                                    }});
          hottap("http://localhost:" + port + "/").request("PUT", 
                                                   {"content-type":"application/json"},
                                                   '{"thisisa":"TEST"}',
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(200);
                                                      response.body.should.equal("Hello World!");
                                                      done();
                                                   });
      });
      it ("responds 415 when Content-Type is unsupported", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    PUT : function(req, res){
                                      res.end("Hello World!");
                                    }});
          hottap("http://localhost:" + port + "/").request("PUT", 
                                                   {"content-type":"application/whatwhat"},
                                                   "",
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(415);
                                                      var parsed = JSON.parse(response.body);
                                                      parsed.error.type.should.equal(415);
                                                      parsed.error.message
                                                                .should.equal("Unsupported Media Type");
                                                      parsed.error.detail
                                                                .should.equal("application/whatwhat");
                                                      done();
                                                   });
      });
      it ("responds 415 when Content-Type is missing on PUT", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    PUT : function(req, res){
                                      res.end("Hello World!");
                                    }});
          hottap("http://localhost:" + port + "/").request("PUT", 
                                                   {},
                                                   "",
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(415);
                                                      var parsed = JSON.parse(response.body);
                                                      parsed.error.type.should.equal(415);
                                                      parsed.error.message
                                                                .should.equal("Unsupported Media Type");
                                                      parsed.error.detail
                                                                .should.equal("None provided.");
                                                      done();
                                                   });
      });
      it ("responds 400 when Content-Type is json, but body doesn't contain JSON", function(done){
        server.route('/', {  GET : function(req, res){
                                      res.end("Hello World!");
                                    },

                                    PUT : function(req, res){
                                      res.end("Hello World!");
                                    }});
          hottap("http://localhost:" + port + "/").request("PUT", 
                                                   {'Content-Type' : 'application/json'},
                                                   "hey wait a minute. this isn't json",
                                                   function(err, response){
                                                      if (err) {
                                                        throw err;
                                                      }
                                                      response.status.should.equal(400);
                                                      var parsed = JSON.parse(response.body);
                                                      parsed.error.type.should.equal(400);
                                                      parsed.error.message
                                                                .should.equal("Bad Request");
                                                      parsed.error.detail
                                                                .should.match(/^Parse Error/);
                                                      done();
                                                   });
      });
    });

  });
});
