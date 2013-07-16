var assert = require('assert'),
  path = require('path');

var cjs = require('../index');

describe('connect-jade-static', function() {

  it('should raise error when insufficient params provided', function() {
    assert.throws(function() {
      cjs({ baseUrl: '/' });
    });

    assert.throws(function() {
      cjs({ baseDir: '/' });
    });

  });

  it('should serve jade file', function(done) {
    var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });

    var req = { originalUrl: '/views/tpl.html' };
    var res = { send: function(html) {
      // otherwise jade tries to catch this error :/
      process.nextTick(function() {
        assert.equal(html, '<h1>Hello</h1><ul><li>aaa</li><li>bbb</li><li>ccc</li></ul>');
        done();
      });
    }};
    var next = function(err) {
      throw new Error('Code shouldn\'t reach here');
    };

    mw(req, res, next);
  });

  it('should support jade options', function(done) {
    var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views'), jade: { pretty: true } });

    var req = { originalUrl: '/views/tpl.html' };
    var res = { send: function(html) {
      // otherwise jade tries to catch this error :/
      process.nextTick(function() {
        assert.equal(html,
          '\n<h1>Hello</h1>\n' +
          '<ul>\n' +
          '  <li>aaa</li>\n' +
          '  <li>bbb</li>\n' +
          '  <li>ccc</li>\n' +
          '</ul>');
        done();
      });
    }};
    var next = function(err) {
      throw new Error('Code shouldn\'t reach here');
    };

    mw(req, res, next);
  });

  it('should call next for unknown file', function(done) {
    var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });

    var req = { originalUrl: '/views/blah.html' };
    var res = { send: function(html) {
      throw new Error('Code shouldn\'t reach here');
    }};

    mw(req, res, done);
  });

  it('should raise error if jade template invalid', function(done) {
    var mw = cjs({ baseUrl: '/views', baseDir: path.join(__dirname, 'views') });

    var req = { originalUrl: '/views/tpl_err.html' };
    var res = { send: function(html) {
      throw new Error('Code shouldn\'t reach here');
    }};
    var next = function(err) {
      assert.ok(err instanceof TypeError);
      done();
    };

    mw(req, res, next);
  });

});
