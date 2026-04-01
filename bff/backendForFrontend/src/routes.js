const express = require('express');
const router = express.Router();
const authCtrl = require ('./controllers/authController');
const userCtrl = require ('./controllers/userController');
const contentCtrl = require ('./controllers/contentController');
const socialCtrl = require ('./controllers/socialController');
const auth = require('../src/middleware/auth');
const upload = require('../src/middleware/multer');

// AUTH

router.get('/register/42', authCtrl.registerRedirectTo42);
router.get('/register/callback', authCtrl.registerHandleCallback);
router.post('/register', auth, upload.single('avatar'), authCtrl.classicRegister);
router.get('/auth/42', authCtrl.authRedirectTo42);
router.get('/auth/callback', authCtrl.authHandleCallback);
router.post('/auth', authCtrl.authClassic);
router.put('/auth', auth, authCtrl.changePassword);

// USER

router.get('/user', auth, userCtrl.getAllUsers);
router.get('/user/:userId', auth, userCtrl.getOneUser);
router.put('/user/:userId', auth, upload.single('avatar'), userCtrl.modifyOneUser);
router.put('/user/data42/:userId', auth, userCtrl.getBack42Datas);
router.delete('/user/:userId', auth, userCtrl.deleteOneUser);
router.get('/post/user/:userId', auth, userCtrl.getPostsFromUser);
router.get('/post/commented/:userId', auth, userCtrl.getPostsCommentedByUser);
router.get('/post/liked/:userId', auth, userCtrl.getPostsLikedByUser);
router.get('/media/user/:userId', auth, userCtrl.getMediasFromUser);
router.get('/search42Users/:login', auth, userCtrl.search42Users);

// CONTENT

router.get('/post', auth, contentCtrl.getPosts);
router.post('/post', auth, upload.single('media'), contentCtrl.createOnePost);
router.get('/post/:postId', auth, contentCtrl.getOnePost);
router.put('/post/:postId',  auth, upload.single('media'), contentCtrl.modifyOnePost);
router.delete('/post/:postId', auth, contentCtrl.deleteOnePost);
router.get('/comment/post/:postId', auth, contentCtrl.getCommentsFromPost);
router.post('/comment/post/:postId', auth, contentCtrl.createOneComment);
router.put('/comment/:commentId', auth, contentCtrl.modifyOneComment);
router.delete('/comment/:commentId', auth, contentCtrl.deleteOneComment);
router.get('/like/post/:postId', auth, contentCtrl.getLikesFromPost);
router.post('/like', auth, contentCtrl.likeOnePost);
router.delete('/like/post/:postId', auth, contentCtrl.deleteLikeFromPost);

// SOCIAL

router.get('/social/followers', auth, socialCtrl.getFollowers);
router.get('/social/friends', auth, socialCtrl.getFriends);
router.post('/social/user/:userId', auth, socialCtrl.followUser);
router.delete('/social/user/:userId', auth, socialCtrl.unfollowUser);

module.exports = router;







