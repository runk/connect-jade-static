connect-jade-static
===================

Connect (ExpressJS) middleware for serving html files from jade templates

## Installation

    npm install connect-jade-static


## Usage

    var jadeStatic = require('connect-jade-static');

    app = express();
    app.configure(function() {
      app.use(jadeStatic({
        baseDir: path.join(__dirname, '/views/partials'),
        baseUrl: '/partials',
        jade: { pretty: true }
      });
    });
