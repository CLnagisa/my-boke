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
    User = require('../models/user.js');

router.get('/', function(req, res) {
	res.render('index', {
		title: '主页',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
router.get('/reg', function(req, res) {
	res.render('reg', {
		title: '注册',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});
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
router.get('/login', function(req, res) {
	res.render('login', {title: '登录'});
});
router.post('/login', function(req, res) {

});
router.get('/post', function(req, res) {
	res.render('/post', {title: '发表'});
});
router.post('/post', function(req, res) {

});
router.get('/logout', function(req, res) {

});

module.exports = router;