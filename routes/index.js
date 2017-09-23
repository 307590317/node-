var express = require('express');
var router = express.Router();
var crypto=require('crypto');
var User=require('../modules/user.js');
var Post=require('../modules/post.js');
/* GET home page. */
router.get('/', function(req, res, next) {
  Post.get(null,function (err,posts) {
    if (err) {
      posts=[];
    }
    res.render('index', {
      title: '首页',
      posts:posts
    });
  });
});
//用户页面
router.get('/u/:user', function(req, res) {
  User.get(req.params.user, function(err, user) {
    if (!user) {
      req.flash('error', '用户不存在');
      return res.redirect('/');
    }
    Post.get(user.name, function(err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('user', {
        title: user.name,
        posts: posts
      });
    });
  });
});
//评论页
router.post('/post',checkLogin);
router.post('/post',function (req,res) {
  var currentUser=req.session.user;
  var post=new Post(currentUser.name,req.body.post);
  post.save(function(err){
    if(err){
      req.flash('error',err);
      res.redirect('/');
    }else{
      req.flash('success','发表成功');
      res.redirect('/u/'+currentUser.name);
    }
  });
});
//注册页
router.get('/reg',checkNotLogin);
router.get('/reg',function (req,res,next) {
  res.render('reg',{title:'用户注册'});
});
router.post('/reg',checkNotLogin);
router.post('/reg',function (req, res,next) {
  //检查用户两次输入的口令是否一致
  if(req.body['password-repeat']!=req.body['password']){
    console.log("jkjkj");
    req.flash('error','两次输入的口令不一致');
    return res.redirect('/reg');
  }

  //生成口令的散列值
  var md5=crypto.createHash('md5');
  var password=md5.update(req.body.password).digest('base64');

  var newUser=new User({
    name:req.body.username,
    password:password
  });

  //检查用户名是否已经存在
  User.get(newUser.name, function(err, user) {
    if (user)
      err = '用户名已经存在';
    if (err) {
      req.flash('error', err);
      return res.redirect('/reg');
    }
//如果不存在则新增用户
    newUser.save(function(err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/reg');
      }
      req.session.user = newUser;
      req.flash('success', '注册成功');
      res.redirect('/');
    });
  });
});
router.get('/login',function (req, res,next) {
  res.render('login',{title:'用户登入'});
});
router.post('/login',function (req, res,next) {
  //生成口令的散列值
  var md5=crypto.createHash('md5');
  var password=md5.update(req.body.password).digest('base64');
  var username=req.body.username;
  User.get(username,function(err,user){
    if(!user){
      req.flash('error','用户名不存在');
      return res.redirect('/login');
    }else{
      if(user.password===password){
        req.flash('success','登录成功');
        req.session.user=user;
        return res.redirect('/');
      }else{
        req.flash('error','密码错误');
        return res.redirect('/login');
      }
    }
  });
});
router.get('/logout',function (req,res,next) {
  req.session.user=null;
  req.flash('success','登出成功');
  res.redirect('/');
})
module.exports = router;
//确认未登入,已登入不能登录及注册
function checkNotLogin(req,res,next){
  if(req.session.user){
    req.flash('error','已登入');
    res.redirect('/');
  }else{
    next();
  }
}

//确认已登入,未登入不能登出,并且转向登录页面
function checkLogin(req,res,next){
  if(req.session.user){
    next();
  }else{
    req.flash('error','未登入');
    res.redirect('/login');
  }
}