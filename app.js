//启动文件，入口文件


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var settings = require('./settings');
var flash = require('connect-flash');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var app = express();          //生成一个express实例app

/*
	这个方法在multer1.0.0一下的版本才可以适用
var multer = require('multer');
app.use(multer({
	dest: './public/images',                    //路径
	rename: function(fieldname, filename) {     //上传后的文件名
		return filename;
	}
}));*/

app.use(session({
	secret: settings.cookieSecret,
	key: settings.db, //cookoe name
	cookie: {maxAge: 1000 * 60 * 60 * 24 * 30}, //30days
	resave: false,
	saveUninitialized: true,
	store: new MongoStore({
		/*db: settings.db,
		host: settings.host,
		port: settings.port*/
		url: 'mongodb://localhost/bole'
	})
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));         //设置views目录为视图文件目录
app.set('view engine', 'ejs');                           //设置视图模版引擎为ejs

app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));    //设置public文件夹为存放静态文件的目录



app.use('/', index);            //路由控制器
app.use('/users', users);       //路由控制器


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

module.exports = app;
