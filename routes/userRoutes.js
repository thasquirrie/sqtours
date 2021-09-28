const express = require('express');

const router = express.Router();

const userController = require('./../controller/userController');
const authController = require('./../controller/authController');
const reviewRouter = require('./reviewRoutes');


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.use('/:userId/reviews', reviewRouter);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.post('/logout', authController.logout);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUploadPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getOneUser);



router
.route('/')
.get(authController.restrictTo('admin'), userController.getAllUsers);
// .post(userController.createUser);
router
  .route('/:id')
  .get(authController.restrictTo('admin'), userController.getOneUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);


module.exports = router;