const express = require('express');
const router = express.Router();
const authCtrl = require ('./controller');

router.post('/', authCtrl.createOneAuth);
router.get('/', authCtrl.getAllAuths);
router.delete('/', authCtrl.deleteAllAuths);
router.get('/:authId', authCtrl.getOneAuth);
router.put('/:authId', authCtrl.modifyOneAuth);
router.delete('/:authId', authCtrl.deleteOneAuth);
router.get('/login/:login42', authCtrl.getOneAuthByLogin42);
router.get('/email/:userEmail', authCtrl.getOneAuthByEmail);
router.get('/user/:userId', authCtrl.getOneAuthByUserId);
router.put('/user/:userId', authCtrl.modifyOneAuthByUserId);
router.delete('/user/:userId', authCtrl.deleteOneUser);

module.exports = router;