var assert = require('assert'),
  path = require('path'),
  cjs = require('../index');


describe('connect-jade-static', function() {

  var next = function(err) {
    throw new Error('next() shouldn\'t be called');
  };

  describe('middleware()', function() {

    it('should raise error when insufficient params provided', function() {
      assert.throws(function() {
        cjs({ baseUrl: '/' });
      });

      assert.throws(function() {
        cjs({ baseDir: '/' });
      });

      assert.throws(function() {
        cjs(null);
      });
    });

    it('should serve jade file', function(done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });
      var headers = {};
      var req = { originalUrl: '/views/tpl.html' };
      var res = {
        end: function(html) {
          // otherwise jade tries to catch this error :/
          process.nextTick(function() {
            assert.equal(html, '<h1>Hello</h1><ul><li>aaa</li><li>bbb</li><li>ccc</li></ul>');
            assert.equal(headers['Content-Length'], 59);
            assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
            done();
          });
        },
        setHeader: function(k, v) {
          headers[k] = v;
        }
      };

      mw(req, res, next);
    });

    it('should serve index file', function (done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });
      var headers = {};
      var req = { originalUrl: '/views/foo/' };
      var res = {
        end: function (html) {
          // otherwise jade tries to catch this error :/
          process.nextTick(function () {
            assert.equal(html, '<h1>index</h1>');
            assert.equal(headers['Content-Length'], 14);
            assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
            done();
          });
        },
        setHeader: function (k, v) {
          headers[k] = v;
        }
      };

      mw(req, res, next);
    });

    it('should support jade options', function(done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views'), jade: { pretty: true } });
      var headers = {};
      var req = { originalUrl: '/views/tpl.html' };
      var res = {
        end: function(html) {
          // otherwise jade tries to catch this error :/
          process.nextTick(function() {
            assert.equal(html,
              '\n<h1>Hello</h1>\n' +
              '<ul>\n' +
              '  <li>aaa</li>\n' +
              '  <li>bbb</li>\n' +
              '  <li>ccc</li>\n' +
              '</ul>');
            assert.equal(headers['Content-Length'], 71);
            assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
            done();
          });
        },
        setHeader: function(k, v) {
          headers[k] = v;
        }
      };

      mw(req, res, next);
    });

    it('should call next for unknown file', function(done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });
      var req = { originalUrl: '/views/blah.html' };
      var res = { end: function(html) {
        throw new Error('Code shouldn\'t reach here');
      }, send: function(code) {
        throw new Error('Code shouldn\'t reach here');
      }};

      mw(req, res, done);
    });

    it('should ignore requests without an appropriate .jade file', function(done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });
      var req = { originalUrl: '/views/no_tpl.css' };
      var res = { end: function(html) {
        throw new Error('Code shouldn\'t reach here');
      }, send: function(code) {
        throw new Error('Code shouldn\'t reach here');
      }};
      mw(req, res, done);
    });

    it('should raise error if jade template invalid', function(done) {
      var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });
      var req = { originalUrl: '/views/tpl_err.html' };
      var res = { end: function(html) {
        throw new Error('Code shouldn\'t reach here');
      }};

      mw(req, res, function(err) {
        assert.ok(err instanceof TypeError);
        done();
      });
    });
    it('should honor the maxAge option', function(done) {
      var mw = cjs({
        baseUrl: '/views',
        baseDir: path.join(__dirname, 'views'),
        maxAge: 5432
      });
      var exp = new Date((+new Date()) + 5432).toGMTString();
      var headers = {};
      var req = { originalUrl: '/views/tpl.html' };
      var res = {
        end: function(html) {
          // otherwise jade tries to catch this error :/
          process.nextTick(function() {
            assert.equal(headers['Cache-Control'], 'max-age=5432');
            assert.equal(headers.Expires, exp);
            done();
          });
        },
        setHeader: function(k, v) {
          headers[k] = v;
        }
      };

      mw(req, res, next);
    });
  });


  describe('getTplPath()', function() {

    var baseDir = path.join(__dirname, 'views');
    var opts = {baseUrl: '/testing', baseDir: baseDir, ext: ['.jade'], allowedExt: ['.html', '.htm'], serveIndex: true};
    var minimalOpts = {baseUrl: '/testing', baseDir: baseDir};

    var helper = function(url) {
      return cjs.getTplPath(url, opts);
    };

    it('should work fine with basic path', function() {
      assert.equal(helper('/testing/foo/bar.html'), baseDir + '/foo/bar.jade');
    });

    it('should allow all allowed extensions', function() {
      assert.equal(helper('/testing/foo/bar.htm'), baseDir + '/foo/bar.jade');
      assert.equal(helper('/testing/foo/bar.html'), baseDir + '/foo/bar.jade');
    });

    it('should reject not allowed extensions', function () {
      assert.equal(helper('/testing/foo/bar.docx'), null);
    });

    it('should allow all allowed extensions with minimal options', function() {
      assert.equal(cjs.getTplPath('/testing/foo/bar.htm', minimalOpts), baseDir + '/foo/bar.jade');
      assert.equal(cjs.getTplPath('/testing/foo/bar.html', minimalOpts), baseDir + '/foo/bar.jade');
    });

    it('should reject not allowed extensions with minimal options', function () {
      assert.equal(cjs.getTplPath('/testing/foo/bar.docx', minimalOpts), null);
    });

    it('should work fine with path with params', function() {
      assert.equal(helper('/testing/foo/baz.html?one=two&three=3'), baseDir + '/foo/baz.jade');
      assert.equal(helper('/testing/foo/baz.html?kraken-here'), baseDir + '/foo/baz.jade');
    });

    it('should work fine with path with search hash', function () {
      assert.equal(helper('/testing/foo/baz.html#menu'), baseDir + '/foo/baz.jade');
    });

    it('should return index.jade for a directory', function () {
      assert.equal(helper('/testing/foo/'), baseDir + '/foo/index.jade');
    });

    it('should return index.jade for root', function () {
      assert.equal(cjs.getTplPath('/', {baseUrl: '/', baseDir: baseDir + '/foo'}), baseDir + '/foo/index.jade');
    });

    it('should return index.jade for a directory whithout trailing slash', function () {
      assert.equal(helper('/testing/foo'), baseDir + '/foo/index.jade');
    });

    it('should not return index.jade for a directory if disabled', function () {
      assert.equal(cjs.getTplPath('/testing/foo/', {baseUrl: '/testing', baseDir: baseDir, serveIndex: false}), null);
    });
  });

});
