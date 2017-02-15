/*var express = require('express');
var router = express.Router();

// GET home page. 
router.get('/', function(req, res, next) {                  //在访问主页时，就会调用这一段；渲染views/index.ejs模版并显示到浏览器中
  res.render('index', { title: 'Express' });
});

module.exports = router;

*/

var express = require('express');
var router = express.Router();
var crypto = require('crypto'),          //用来加密密码
    User = require('../models/user.js'),
    Post = require('../models/post.js');

//multer 1.0.0以上上传文件写法
var multer = require('multer');
var storage = multer.diskStorage({              //diskStorage可以获取到原文件名字
	destination: function(req, file, cb) {
		cb(null, './public/images');
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	}
});
var upload = multer({
	storage: storage
});



router.get('/', function(req, res) {
	Post.get(null, function (err, posts) {
		if(err) {
			posts = [];
		}
		res.render('index', {
			title: '主页',
			user: req.session.user,
			posts: posts,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
});

router.get('/reg', checkNotLogin);             //已登录了就不能再访问注册页
router.get('/reg', function(req, res) {
	res.render('reg', {
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/reg', checkNotLogin);           //已登录了就不能再访问注册页
router.post('/reg', function(req, res) {
	var name = req.body.name,
		password = req.body.password,
		passwored_re = req.body['password-repeat'];
		//检验用户两次输入的密码是否一致
	if (passwored_re != password) {
		req.flash('error', '两次输入的密码不一致！');
		return res.redirect('/reg');  //返回注册页
	}
	//生成密码的md5值
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	var newUser = new User({
		name: req.body.name,
		password: password,
		email: req.body.email
	});
	//检查用户名是否已经存在
	User.get(newUser.name, function(err, user) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		if(user) {
			req.flash('error', '用户存在！');
			return res.redirect('/reg');//返回注册页
		}
		//如果不存在则新增用户
		newUser.save(function(err, user) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/reg');//注册失败返回注册页
			}
			req.session.user = user;//用户信息存入session
			req.flash('success', '注册成功！');
			res.redirect('/');//注册成功后返回主页
		});
	});
});

router.get('/login', checkNotLogin);         //已登录了就不能再访问登录页
router.get('/login', function(req, res) {
	res.render('login', {
		title: '登录',
		user: req.session.user,
		success: req.flash('success').toString(),
        error: req.flash('error').toString() 
	});
});

router.post('/login', checkNotLogin);        //已登录了就不能再访问注册页
router.post('/login', function(req, res) {
	//生成密码的md5值
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');
	//检查用户是否存在
	User.get(req.body.name, function(err, user) {
		if(!user) {
			req.flash('error', '用户不存在！');
			return res.redirect('/login');   //用户不存在则跳转到登录页
		}
		//检查密码是否一致
		if(user.password != password) {
			req.flash('error', '密码错误！');
			return res.redirect('/login');   //密码错误则跳回登录页
		}
		//用户名密码都匹配后，降用户信息存入session
		req.session.user = user;
		req.flash('success', '登录成功！');
		res.redirect('/');  //登录成功后跳回主页
	})
});

router.get('/post', checkLogin);           //未登录了就不能再访问发表页
router.get('/post', function(req, res) {
	res.render('post', {
		title: '发表',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/post', checkLogin);      //未登录了就不能再访问发表页
router.post('/post', function(req, res) {
	var currentUser = req.session.user,
		post = new Post(currentUser.name, req.body.title, req.body.post);
	post.save(function (err) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		req.flash('success', '发布成功！');
		res.redirect('/');
	});
});

router.get('/logout', checkLogin);    //未登录了就不能再访问登出
router.get('/logout', function(req, res) {
	req.session.user = null;
	req.flash('success', '登出成功！');
	res.redirect('/');  //登出成功后后跳转到主页
});

router.get('/upload', checkLogin);
router.get('/upload', function(req, res) {
	res.render('upload', {
		title: '文件上传',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

router.post('/upload', checkLogin);
router.post('/upload', upload.fields([
		{name: 'file1'},
		{name: 'file2'},
		{name: 'file3'},
		{name: 'file4'},
		{name: 'file5'}
	]), function(req, res) {
		for(var i in req.files) {
			console.log(req.files[i]);
		}
		req.flash('success', '文件上传成功！');
		res.redirect('/upload');
	}
);



module.exports = router;

function checkLogin(req, res, next) {  //检查没登陆情况下
	if(!req.session.user) {
		req.flash('error', '未登录!');
		res.redirect('/login');    //返回登录页
	}
	next();   //转移控制权，中间件，进入到下一个路由
}

function checkNotLogin(req, res, next) {    //检查已登录情况下
	if(req.session.user) {
		req.flash('error', '已登录！');
		res.redirect('back'); //返回之前的页面
	}
	next();
}