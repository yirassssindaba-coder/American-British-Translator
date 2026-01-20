'use strict';

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');
const userRoutes = require('./routes/api.js');

const app = express();

// Static assets + middleware
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' })); // For FCC testing purposes only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page (static HTML)
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC testing routes
fccTestingRoutes(app);

// User routes
userRoutes(app);

// 404
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;

// IMPORTANT:
// - For mocha/chai-http tests, we must export the app WITHOUT listening on a port.
// - FCC browser runner needs a listening server, so we allow it only when RUN_FCC_TESTS=true.
module.exports = app;

/**
 * When NOT in test env:
 * - normal behavior: start server
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(portNum, () => {
    console.log(`Listening on port ${portNum}`);
  });
}

/**
 * When in test env:
 * - DO NOT auto-listen (this prevents EADDRINUSE during `npm run test`)
 * - If you want the FCC runner UI in the browser, run with:
 *   RUN_FCC_TESTS=true npm start
 *   (Windows PowerShell): $env:RUN_FCC_TESTS="true"; npm start
 */
if (process.env.NODE_ENV === 'test' && process.env.RUN_FCC_TESTS === 'true') {
  app.listen(portNum, () => {
    console.log(`Listening on port ${portNum}`);
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  });
}
