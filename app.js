var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');

var app = express();

// Setup mongoose connection
mongoose.set('strictQuery', false);
const dev_db_uri =
    'mongodb+srv://BradySavarie:Robert1998@cluster0.zq27oze.mongodb.net/local_library?retryWrites=true&w=majority';
const connectionString = process.env.MONGODB_URI || dev_db_uri;
main().catch((err) => console.log(err));
async function main() {
    await mongoose.connect(connectionString);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20,
});

app.use(limiter);
app.use(compression());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
        },
    })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
