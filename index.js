var path = require('path'),
  fs = require('fs'),
  jade = require('jade'),
  url = require('url'),
  assert = require('assert');

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

    if (!filepath)
      return next();

    if (filepath.indexOf(opts.baseDir) !== 0)
      return res.send(403);

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
  };

};


module.exports.getTplPath = function(req, opts) {
  assert(opts.ext && Array.isArray(opts.ext), 'opts.ext should be provided and be an array');
  assert(opts.baseDir, 'opts.baseDir should be provided');

  var parsed = url.parse(req.originalUrl);
  var pathname = parsed.pathname.replace(opts.baseUrl, '');

  for (var i = 0; i < opts.ext.length; i++) {
    var ext = opts.ext[i];
    var filepath = path.join(opts.baseDir, pathname.replace(/\.html$/, ext));

    // make sure that regexp replace worked from line above
    if (path.extname(filepath) != ext)
      continue;

    // make sure that file exists
    if (fs.existsSync(filepath))
      return filepath;
  };
  return null;
};
