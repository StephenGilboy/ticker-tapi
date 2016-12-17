var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socket_io = require('socket.io');
var routes = require('./routes/index');
const Ticker = require('./domain/ticker');
const eventHub = require('central-event');

var app = express();
var io = socket_io();
app.io = io;

const ticker = new Ticker();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.on('connection', function (socket) {
  socket.on('subscribe', function (symbol) {
    ticker.subscribe(symbol).then((quote) => {
        // use the returned underlier/symbol for the room name for consistency.
        socket.join(quote.under);
    }, (err) => {
      console.log('Subscribe error: ' + err);
      socket.emit('error', {message: err});
    });
  });

  socket.on('unsubscribe', function (symbol) {
    socket.leave(symbol);
  });

  socket.on('leave', function (room) {
    ticker.unsubscribe(room).then((symb) => {
      console.log('Subscriber left');
    }, (err) => {
      console.log('Unsubscribe error: ' + err);
      socket.emit('error', {message: err});
    });
  });
});

eventHub.on('tick', (quote) => {
  io.to(quote.symbol).emit('tick', quote);
});

eventHub.on('error', (err) => {
  console.error(err);
});

module.exports = app;
