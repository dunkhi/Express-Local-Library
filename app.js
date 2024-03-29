var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var novaRouter = require('./routes/nova');
const catalogRouter = require("./routes/catalog"); //Import routes for "catalog" area of site


var app = express();
var mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const mongoDB = "mongodb+srv://carlsagan:nikolaTesla91@cluster48538.a5yfwu0.mongodb.net/local_library?retryWrites=true&w=majority"

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
  console.log('in moongoose');
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// css
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/nova', novaRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log('in app.js');

module.exports = app;
