const express = require('express');
const router = express.Router();
const contentCtrl = require ('./controller');

router.post('/post/', contentCtrl.createOnePost);
router.get('/post/', contentCtrl.getAllPosts);
router.delete('/post/', contentCtrl.deleteAllPosts);
router.get('/post/user/:userId', contentCtrl.getUserPosts);
router.delete('/post/user/:userId', contentCtrl.deleteUserPosts);
router.get('/post/count/user/:userId', contentCtrl.getUserPostsCount);
router.get('/post/:postId', contentCtrl.getOnePost);
router.put('/post/:postId', contentCtrl.modifyOnePost);
router.delete('/post/:postId', contentCtrl.deleteOnePost);

router.post('/comment/', contentCtrl.createOneComment);
router.get('/comment/', contentCtrl.getAllComments);
router.delete('/comment/', contentCtrl.deleteAllComments);
router.get('/comment/user/:userId', contentCtrl.getUserComments);
router.delete('/comment/user/:userId', contentCtrl.deleteUserComments);
router.get('/comment/post/:postId', contentCtrl.getPostComments);
router.delete('/comment/post/:postId', contentCtrl.deletePostComments);
router.get('/comment/count/post/:postId', contentCtrl.getPostCommentsCount);
router.get('/comment/:commentId', contentCtrl.getOneComment);
router.put('/comment/:commentId', contentCtrl.modifyOneComment);
router.delete('/comment/:commentId', contentCtrl.deleteOneComment);

// quand un utilisateur ou admin supprime un commentaire depuis le front, 
// faire put (et non delete) et changer le champ booleen deleted    ---- > à gérer dans le BFF

router.post('/like/', contentCtrl.createOneLike);
router.get('/like/', contentCtrl.getAllLikes);
router.delete('/like/', contentCtrl.deleteAllLikes);
router.get('/like/user/:userId', contentCtrl.getUserLikes);
router.delete('/like/user/:userId', contentCtrl.deleteUserLikes);
router.get('/like/post/:postId', contentCtrl.getPostLikes);
router.delete('/like/post/:postId', contentCtrl.deletePostLike);
router.get('/like/:likeId', contentCtrl.getOneLike);
router.delete('/like/:likeId', contentCtrl.deleteOneLike);
router.get('/like/count/post/:postId', contentCtrl.getPostLikesCount);

router.delete('/user/:userId', contentCtrl.deleteOneUserContent);

module.exports = router;