var express = require("express");
var router = express.Router();
const passport = require("passport");
const localStrategy = require("passport-local");
const userModel = require("./users");
const postModel = require("./posts");
const storyModel = require("./story");
passport.use(new localStrategy(userModel.authenticate()));
const upload = require("./multer");
const utils = require("../utils/utils");


// GET
router.get("/", function (req, res) {
  res.render("index", { footer: false });
});

router.get("/login", function (req, res) {
  res.render("login", { footer: false });
});

router.get("/like/post/:postid", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({_id: req.user._id});
  let post = await postModel.findOne({_id : req.params.postid}); 
      // if post is not like by user then like it
    if(post.like.indexOf(user._id) === -1){
        post.like.push(user._id);
    }else{ // if this post is already liked by user then remove like
        post.like.splice(post.like.indexOf(user._id), 1);
    }
    await post.save();
    res.redirect("/feed");
  
});

router.get("/feed", isLoggedIn, async function (req, res) {
    const user = await userModel.findOne({_id: req.user._id});
    const posts = await postModel.find().populate("user");
      res.render('feed', { footer: true, posts, user});
});

router.get("/profile", isLoggedIn, async function (req, res) {
  let username = req.user.username;
  let user = await userModel
  .findOne({username: username})
  .populate('posts')  // id se data nikalne ke liye populate() ka use kiya jata h
  res.render("profile", { footer: true, user });
});

router.get("/profile/:user", isLoggedIn, async function (req, res) {
  res.render("userprofile", { footer: true});
});

router.get("/follow/:userid", isLoggedIn, async function (req, res) {
    res.send("this is follow/:userid");
});

router.get("/search", isLoggedIn, async function (req, res) {
  res.render("search", { footer: true});
});

router.get("/save/:postid", isLoggedIn, async function (req, res) {
  res.send("this is save");
});

router.get("/search/:user", isLoggedIn, async function (req, res) {
  const regex = new RegExp(`^${req.params.user}`, 'i');
  const userprofile = await  userModel.find({username: regex});
  res.json(userprofile);
});

router.get("/edit", isLoggedIn, async function (req, res) {
  let user = req.user;
  res.render("edit", { footer: true, user });
});

router.get("/upload", isLoggedIn, async function (req, res) {
  res.render("upload", { footer: true});

});

router.post("/update", isLoggedIn, async function (req, res) {
   let user = await userModel.findOneAndUpdate(
    {username: req.user.username},
    {username: req.body.username, name: req.body.name, bio: req.body.bio},
    {new : true}
    );
 
    // console.log(user, "this is updated user");
    req.logIn(user, function(err){
      res.redirect("/profile");
      if(err) throw err;
    })
});

router.post("/post", isLoggedIn, upload.single("image"), async function (req, res) { 
     let user = await userModel.findOne({username : req.user.username});
     let post = await postModel.create({
      caption : req.body.caption, 
      picture : req.file.filename,
      user: user._id,
     })

     user.posts.push(post._id);
      await user.save();
     res.render("feed", { footer: true});
  }
);

router.post("/upload/profilepic", isLoggedIn, upload.single("image"), async function (req, res) {
  let user = await userModel.findOneAndUpdate(
    {username: req.user.username},
    {picture: req.file.filename},
    {new : true}
    );
 
    req.logIn(user, function(err){
      res.redirect("/edit");
      if(err) throw err;
    })
});

// POST

router.post("/register", function (req, res) {
  const user = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name,
  });

  userModel.register(user, req.body.password).then(function (registereduser) {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
