const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');
const cors = require('cors');

const routes = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.get('/.well-known/acme-challenge/clpPmApwieOeBkZRuGraxPGTpFaomjDwHBr2Ux5ChBI', function (req, res) {
  res.send('clpPmApwieOeBkZRuGraxPGTpFaomjDwHBr2Ux5ChBI.jgkX-hetJtOPr-FJcfSN5VmYj5eCmmCtg_iTILuHYQg');
});
app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.json(['error', {
      message: err.message,
      error: {}
    }]);
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json(['error', {
    message: err.message,
    error: {}
  }]);
});

module.exports = app;
