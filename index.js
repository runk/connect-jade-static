/**
 * based on connect-jade-static (https://github.com/runk/connect-jade-static)
 * connect-pug-static is not completed and cannot be used. This is a quick fix to turn connect-jade-static to handle
 * pug files
 */

const _ = require('lodash');
const path = require('path');
const fs = require('fs'); // eslint-disable-line id-length
const pug = require('pug');
const url = require('url');
const assert = require('assert');

const defaultOptions = {
  // Pug options
  pug: {},
  // Serve index.pug if http://someurl/example/ is requested
  serveIndex: true,
  // Valid pug template extensions
  ext: ['.pug'],
  // Allowed request extension
  allowedExt: ['.pug', '.htm', '.html'],
  // Header for Cache-Control: max-age=0
  maxAge: 0,
};


module.exports = function (opts) {
  if (!opts.baseDir) {
    throw new Error('baseDir should be set');
  }

  if (!opts.baseUrl) {
    throw new Error('baseUrl should be set');
  }

  const newOpts = module.exports.getDefaultOptions(opts);

  return function (req, res, next) {
    if (!_.startsWith(req.originalUrl, newOpts.baseUrl)) {
      return next();
    }

    const filePath = module.exports.getTplPath(req.originalUrl, newOpts);

    if (!filePath) {
      return next();
    }

    if (!_.startsWith(filePath, newOpts.baseDir)) {
      return res.sendStatus(403);
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        return next(err);
      }

      if (!stats.isFile()) {
      return next();
    }

    pug.renderFile(filePath, newOpts.pug, (renderErr, html) => {
      if (renderErr) {
        return next(renderErr);
      }

      res.setHeader('Content-Length', Buffer.byteLength(html));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const now = +new Date();
    const expires = new Date(now + newOpts.maxAge);
    res.setHeader('Cache-Control', `max-age=${newOpts.maxAge}`);
    res.setHeader('Expires', expires.toGMTString());
    return res.end(html);
  });
  });
  };
};


module.exports.getDefaultOptions = (opts = {}) => _.assign({}, defaultOptions, opts);


module.exports.getTplPath = (requestUrl, opts) => {
  const newOpts = module.exports.getDefaultOptions(opts);
  assert(newOpts.ext && _.isArray(newOpts.ext), 'newOpts.ext should be provided and be an array');
  assert(newOpts.baseDir, 'newOpts.baseDir should be provided');

  const parsed = url.parse(requestUrl);
  const pathname = parsed.pathname.replace(newOpts.baseUrl, '');
  let requestedExt = path.extname(pathname);
  let pathnameWithoutExt = pathname.substr(0, pathname.length - requestedExt.length);

  if (newOpts.serveIndex && requestedExt === '') {
    // Handle http://example.com/example-path
    if (pathname.substr(-1) !== '/') {
      pathnameWithoutExt += '/';
    }
    // Handle http://example.com/example-path/
    pathnameWithoutExt += 'index';
    requestedExt = newOpts.allowedExt[0];
  }

  // Allow only .html .htm .pug ...
  if (!_.includes(newOpts.allowedExt, requestedExt)) {
    return null;
  }

  // Search for an existing template file
  for (let idx = 0; idx < newOpts.ext.length; idx++) {
    const ext = newOpts.ext[idx];
    const filePath = path.join(newOpts.baseDir, pathnameWithoutExt + ext);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
};
