const express = require('express');
const router = express.Router();
const userCtrl = require ('./controller');

router.post('/', userCtrl.createOneUser);
router.get('/', userCtrl.getAllUsers);
router.delete('/', userCtrl.deleteAllUsers);
router.get('/:userId', userCtrl.getOneUser);
router.put('/:userId', userCtrl.modifyOneUser);
router.delete('/:userId', userCtrl.deleteOneUser);
router.get('/username/:username', userCtrl.getOneUserByUsername);

module.exports = router;