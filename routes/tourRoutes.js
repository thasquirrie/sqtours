const express = require('express');

router = express.Router();
const authController = require('./../controller/authController');
const tourController = require('../controller/tourController.js');
const reviewRouter  = require('./reviewRoutes');


// router.param('id', tourController.checkTour);

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistanceFromPoint);
router.route('/top-5-cheap-tours').get(tourController.aliasTopTours, tourController.getAllTours);
router.route('/cheap-tours').get(tourController.aliasCheapTours, tourController.getAllTours);
router.route('/low-price-tours').get(tourController.aliasLowPriceTours, tourController.getAllTours);


router.route('/tour-stats').get(tourController.getTourStats);
router.route('/tour-dates/:year').get(tourController.getTourStartDates);


router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router.use(authController.protect);

router
  .route('/:id')
  .get(tourController.getOneTour)
  .patch(tourController.uploadTourImages, tourController.resizeTourImages, authController.restrictTo('admin'),tourController.updateTour)
  .delete(authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

  // router.route('/:tourId/reviews')
  // .get(reviewController.getOneReview)
  // .post(reviewController.createOneReview);


module.exports = router;