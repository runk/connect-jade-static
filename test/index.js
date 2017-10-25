const assert = require('assert');
const path = require('path');
const connectPugStatic = require('../index');


describe('connectPugStatic', () => {
  let middleware = null;
  const baseDir = path.join(__dirname, 'views');
  const next = () => {
    throw new Error('next() shouldn\'t be called');
  };

  beforeEach(() => {
    middleware = connectPugStatic({ baseUrl: '/views', baseDir });
  });

  describe('middleware()', () => {
    it('should raise error when insufficient params provided', () => {
      assert.throws(() => { connectPugStatic({ baseUrl: '/' }); });
      assert.throws(() => { connectPugStatic({ baseDir: '/' }); });
      assert.throws(() => { connectPugStatic(null); });
    });

    it('should serve pug file', (done) => {
      const headers = {};
      const req = { originalUrl: '/views/tpl.html' };
      const res = {
        end: (html) => {
          // otherwise pug tries to catch this error :/
          process.nextTick(() => {
            assert.equal(html, '<h1>Hello</h1><ul><li>aaa</li><li>bbb</li><li>ccc</li></ul>');
            assert.equal(headers['Content-Length'], 59);
            assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
            done();
          });
        },
        setHeader: (key, value) => {
          headers[key] = value;
        },
      };

      middleware(req, res, next);
    });

    it('should serve index file', (done) => {
      const headers = {};
      const req = { originalUrl: '/views/foo/' };
      const res = {
        end: (html) => {
          // otherwise pug tries to catch this error :/
          process.nextTick(() => {
            assert.equal(html, '<h1>index</h1>');
            assert.equal(headers['Content-Length'], 14);
            assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
            done();
          });
        },
        setHeader: (key, value) => {
          headers[key] = value;
        },
      };

      middleware(req, res, next);
    });

    it('should support pug options', (done) => {
      middleware = connectPugStatic({
        baseUrl: '/views',
        baseDir: path.join(__dirname, 'views'),
        pug: { pretty: true },
      });
      const headers = {};
      const req = { originalUrl: '/views/tpl.html' };
      const res = {
        end: (html) => {
          // otherwise pug tries to catch this error :/
          process.nextTick(() => {
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
        setHeader: (key, value) => {
          headers[key] = value;
        },
      };

      middleware(req, res, next);
    });

    it('should call next for unknown file', (done) => {
      const req = { originalUrl: '/views/blah.html' };
      const res = {
        end: () => { throw new Error('Code shouldn\'t reach here'); },
        send: () => { throw new Error('Code shouldn\'t reach here'); },
      };

      middleware(req, res, done);
    });

    it('should ignore requests without an appropriate .pug file', (done) => {
      const req = { originalUrl: '/views/no_tpl.css' };
      const res = {
        end: () => { throw new Error('Code shouldn\'t reach here'); },
        send: () => { throw new Error('Code shouldn\'t reach here'); },
      };

      middleware(req, res, done);
    });

    it('should raise error if pug template invalid', (done) => {
      const req = { originalUrl: '/views/tpl_err.html' };
      const res = {
        end: () => {
          throw new Error('Code shouldn\'t reach here');
        },
      };

      middleware(req, res, (err) => {
        assert.ok(err instanceof TypeError);
        done();
      });
    });

    it('should honor the maxAge option', (done) => {
      middleware = connectPugStatic({
        baseUrl: '/views',
        baseDir: path.join(__dirname, 'views'),
        maxAge: 5432,
      });
      const exp = new Date((+new Date()) + 5432).toGMTString();
      const headers = {};
      const req = { originalUrl: '/views/tpl.html' };
      const res = {
        end: () => {
          // otherwise pug tries to catch this error :/
          process.nextTick(() => {
            assert.equal(headers['Cache-Control'], 'max-age=5432');
            assert.equal(headers.Expires, exp);
            done();
          });
        },
        setHeader: (key, value) => {
          headers[key] = value;
        },
      };

      middleware(req, res, next);
    });
  });


  describe('getTplPath()', () => {
    const opts = {
      baseUrl: '/testing',
      baseDir,
      ext: ['.pug'],
      allowedExt: ['.html', '.htm'],
      serveIndex: true,
    };
    const minimalOpts = { baseUrl: '/testing', baseDir };

    const helper = (url) => connectPugStatic.getTplPath(url, opts);

    it('should work fine with basic path', () => {
      assert.equal(helper('/testing/foo/bar.html'), `${baseDir}/foo/bar.pug`);
    });

    it('should allow all allowed extensions', () => {
      assert.equal(helper('/testing/foo/bar.htm'), `${baseDir}/foo/bar.pug`);
      assert.equal(helper('/testing/foo/bar.html'), `${baseDir}/foo/bar.pug`);
    });

    it('should reject not allowed extensions', () => {
      assert.equal(helper('/testing/foo/bar.docx'), null);
    });

    it('should allow all allowed extensions with minimal options', () => {
      assert.equal(connectPugStatic.getTplPath('/testing/foo/bar.htm', minimalOpts), `${baseDir}/foo/bar.pug`);
      assert.equal(connectPugStatic.getTplPath('/testing/foo/bar.html', minimalOpts), `${baseDir}/foo/bar.pug`);
    });

    it('should reject not allowed extensions with minimal options', () => {
      assert.equal(connectPugStatic.getTplPath('/testing/foo/bar.docx', minimalOpts), null);
    });

    it('should work fine with path with params', () => {
      assert.equal(helper('/testing/foo/baz.html?one=two&three=3'), `${baseDir}/foo/baz.pug`);
      assert.equal(helper('/testing/foo/baz.html?kraken-here'), `${baseDir}/foo/baz.pug`);
    });

    it('should work fine with path with search hash', () => {
      assert.equal(helper('/testing/foo/baz.html#menu'), `${baseDir}/foo/baz.pug`);
    });

    it('should return index.pug for a directory', () => {
      assert.equal(helper('/testing/foo/'), `${baseDir}/foo/index.pug`);
    });

    it('should return index.pug for root', () => {
      assert.equal(connectPugStatic.getTplPath('/', { baseUrl: '/', baseDir: `${baseDir}/foo` }),
        `${baseDir}/foo/index.pug`);
    });

    it('should return index.pug for a directory whithout trailing slash', () => {
      assert.equal(helper('/testing/foo'), `${baseDir}/foo/index.pug`);
    });

    it('should not return index.pug for a directory if disabled', () => {
      assert.equal(connectPugStatic.getTplPath('/testing/foo/', {
        baseUrl: '/testing',
        baseDir,
        serveIndex: false,
      }), null);
    });
  });
});
