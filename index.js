var path = require('path'),
  fs = require('fs'),
  jade = require('jade'),
  url = require('url'),
  assert = require('assert');

var defaultOptions = {
  // Jade options
  jade: {},
  // Serve index.jade if http://someurl/example/ is requested
  serveIndex: true,
  // Valid jade template extensions
  ext: ['.jade'],
  // Allowed request extension
  allowedExt: ['.jade', '.htm', '.html'],
  // Header for Cache-Control: max-age=0
  maxAge: 0
};

module.exports = function(opts) {

  if (!opts.baseDir)
    throw new Error('baseDir should be set');

  if (!opts.baseUrl)
    throw new Error('baseUrl should be set');

  opts = module.exports.getDefaultOptions(opts);

  return function(req, res, next) {

    if (req.originalUrl.indexOf(opts.baseUrl) !== 0)
      return next();

    var filepath = module.exports.getTplPath(req.originalUrl, opts);

    if (!filepath)
      return next();

    if (filepath.indexOf(opts.baseDir) !== 0)
      return res.sendStatus(403);

    fs.stat(filepath, function(err, stats) {
      if (err)
        return next(err);

      if (!stats.isFile())
        return next();

      jade.renderFile(filepath, opts.jade, function renderFile(err, html) {
        if (err)
          return next(err);

        res.setHeader('Content-Length', Buffer.byteLength(html));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        var now = +new Date();
        var expires = new Date(now + opts.maxAge);
        res.setHeader('Cache-Control', 'max-age=' + opts.maxAge);
        res.setHeader('Expires', expires.toGMTString());
        return res.end(html);
      });
    });
  };

};

module.exports.getDefaultOptions = function (opts) {
  opts = opts || {};
  Object.keys(defaultOptions).forEach(function (optionName) {
    if (opts[optionName] === undefined) {
      opts[optionName] = defaultOptions[optionName];
    }
  });
  return opts;
};


module.exports.getTplPath = function(requestUrl, opts) {
  opts = module.exports.getDefaultOptions(opts);
  assert(opts.ext && Array.isArray(opts.ext), 'opts.ext should be provided and be an array');
  assert(opts.baseDir, 'opts.baseDir should be provided');

  var parsed = url.parse(requestUrl);
  var pathname = parsed.pathname.replace(opts.baseUrl, '');
  var requestedExt = path.extname(pathname);
  var pathnameWithoutExt = pathname.substr(0, pathname.length - requestedExt.length);

  if (opts.serveIndex && requestedExt === '') {
    // Handle http://example.com/example-path
    if(pathname.substr(-1) !== '/') {
      pathnameWithoutExt += '/';
    }
    // Handle http://example.com/example-path/
    pathnameWithoutExt += 'index';
    requestedExt = opts.allowedExt[0];
  }

  // Allow only .html .htm .jade ...
  if (opts.allowedExt.indexOf(requestedExt) === -1) {
    return null;
  }

  // Search for an existing template file
  for (var i = 0; i < opts.ext.length; i++) {
    var ext = opts.ext[i];
    var filepath = path.join(opts.baseDir, pathnameWithoutExt + ext);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
  }

  return null;
};
