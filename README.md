connect-jade-static [![Build Status](https://travis-ci.org/runk/connect-jade-static.png)](https://travis-ci.org/runk/connect-jade-static)
===================

Connect (ExpressJS) middleware for serving jade files as static html

## Installation

    npm install connect-jade-static


## Usage

Assume the following structure of your project:

    /views
      /partials
        /file.jade

Let's make jade files from `/views/partials` web accessable:

    var jadeStatic = require('connect-jade-static');

    app = express();
    app.configure(function() {
      app.use(jadeStatic({
        baseDir: path.join(__dirname, '/views/partials'),
        baseUrl: '/partials',
        jade: { pretty: true }
      });
    });

Now, if you start your web server and request `/views/partials/file.html` in browser you
should be able see the compiled jade template.
