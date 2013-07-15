path = require('path');
fs = require('fs');
jade = require('jade');

module.exports = function(opts) {
  var fs, jade, path;

  if (!opts.baseDir) {
    throw new Error('baseDir should be set');
  }

  if (!opts.baseUrl) {
    throw new Error('baseUrl should be set');
  }

  if (opts.jade == null) {
    opts.jade = {};
  }

  return function(req, res, next) {
    var filepath, url;
    if (req.originalUrl.indexOf(opts.baseUrl) !== 0) {
      return next();
    }
    url = req.originalUrl.replace(/html$/, 'jade').replace(opts.baseUrl, '');
    filepath = path.join(opts.baseDir, url);
    if (filepath.indexOf(opts.baseDir) !== 0) {
      return next(new Error('Invalid path'));
    }
    return fs.exists(filepath, function(exists) {
      if (!exists) {
        return next();
      }

      try {
        return jade.renderFile(filepath, opts.jade, function(err, html) {
          if (err) {
            return next(err);
          }
          return res.send(html);
        });
      } catch (e) {
        return next(e);
      }
    });
  };
};
