var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var api = require('./routes/api')
var mobileApi = require('./routes/mobile_api')
var cors = require('cors')
const bodyParser = require('body-parser')
const SLACK_URL = require("./config/slack");
const { IncomingWebhook } = require('@slack/webhook');
const staffJob = require('./config/cronJob');

var app = express();
app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
//app.use(express.json());
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

app.use('/', indexRouter);
app.use('/api', api);
app.use('/api/mobile', mobileApi);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

function replaceErrors(key, value) {
  if (value instanceof Error) {
    var error = {};

    Object.getOwnPropertyNames(value).forEach(function (propName) {
      error[propName] = value[propName];
    });

    return error;
  }

  return value;
}
staffJob.start()
const sendSlack = async (dataErrors, urlAPI = '', user = '') => {
  try {
    const url = SLACK_URL.ERROR;
    const webhook = new IncomingWebhook(url);
    const message = JSON.parse(dataErrors).message ? JSON.parse(dataErrors).message : '';
    const allError = dataErrors.length > 3000 ? dataErrors.substr(0, 2999) : dataErrors;
    const data = {
      text: 'Lỗi API',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@here API: ${urlAPI ? urlAPI : 'Không xác định'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@USER: ${user ? user : 'Ẩn danh'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@MESSAGE: ${message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `@ALL: ${allError}`,
          },
        }
      ]
    };

    await webhook.send(data)
    return 'DONE';
  } catch (error) {
    console.log(error);
    return 'ERROR';
  }

}

// error handler
app.use(async function (err, req, res, next) {
  try {
    if (!('toJSON' in Error.prototype))
      Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
          var alt = {};
          Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
          }, this);

          return alt;
        },
        configurable: true,
        writable: true
      })
    const url = `${req.method} ${req.path}`;
    const user = req.user ? JSON.stringify(req.user) : '';
    const dataErrors = JSON.stringify(err, replaceErrors)
    await sendSlack(dataErrors, url, user)
    return res.status(500).json({ "message": "Internal Server Error", code: 500 })
  } catch (error) {
    await sendSlack('Lỗi trong middleware error handler (app.js)', null, null)
    return res.status(500).json({ "message": "Internal Server Error", code: 500 })
  }

  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // // render the error page
  // res.status(err.status || 500);
  // res.render('error');
});

module.exports = app;
