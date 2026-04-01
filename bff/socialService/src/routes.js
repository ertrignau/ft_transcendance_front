const express = require('express');
const router = express.Router();
const socialCtrl = require ('./controller');

router.post('/', socialCtrl.createOneSocial);
router.get('/', socialCtrl.getAllSocials);
router.delete('/', socialCtrl.deleteAllSocials);
router.get('/:socialId', socialCtrl.getOneSocial);
router.delete('/:socialId', socialCtrl.deleteOneSocial);
router.get('/friends/:userId', socialCtrl.getUserFriends);
router.get('/followers/:userId', socialCtrl.getUserFollowers);
router.get('/friendsCount/:userId', socialCtrl.getUserFriendsCount);
router.get('/followersCount/:userId', socialCtrl.getUserFollowersCount);
router.delete('/user/:userId/friend/:friendId', socialCtrl.deleteOneSocialByUserAndFriend);
router.delete('/user/:userId', socialCtrl.deleteOneUserSocials);

module.exports = router;