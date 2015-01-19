var path = require('path'),
  fs = require('fs'),
  jade = require('jade'),
  url = require('url');

module.exports = function(opts) {

  if (!opts.baseDir)
    throw new Error('baseDir should be set');

  if (!opts.baseUrl)
    throw new Error('baseUrl should be set');

  opts.jade = opts.jade || {};

  opts.ext = opts.ext || ['.jade'];

  return function(req, res, next) {

    if (req.originalUrl.indexOf(opts.baseUrl) !== 0)
      return next();

    var filepath = module.exports.getTplPath(req, opts);

    // Handle only .jade files
    if (opts.ext.indexOf(path.extname(filepath)) === -1)
      return next();

    if (filepath.indexOf(opts.baseDir) !== 0)
      return next(new Error('Invalid path'));

    fs.exists(filepath, function isExists(exists) {
      if (!exists)
        return next();

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
          return res.end(html);
        });
      });
    });
  };

};


module.exports.getTplPath = function(req, opts) {
  var parsed = url.parse(req.originalUrl);
  var urlpath = parsed.pathname.slice(0, -'html'.length).concat('jade').replace(opts.baseUrl, '');

  return path.join(opts.baseDir, urlpath);
};
