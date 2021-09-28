const express = require('express');
const viewsController = require('../controller/viewsController');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');
const router = express.Router();

router.use(authController.isLoggedIn);


router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewsController.getOverview);
router.get('/tours/:slug',authController.isLoggedIn, viewsController.getTour);
router.get('/login',authController.isLoggedIn, viewsController.login);
router.get('/signup',authController.isLoggedIn, viewsController.signup);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.get('/my-reviews', authController.protect, viewsController.getMyReviews);
router.get('/tours/:tourId/add-review', authController.protect, authController.restrictTo('user'), viewsController.addReview);


module.exports = router