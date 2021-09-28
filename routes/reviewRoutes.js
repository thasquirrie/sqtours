const express = require('express');

const router = express.Router( {mergeParams: true});

const authController = require('../controller/authController');
const reviewController = require('../controller/reviewController');

router.use(authController.protect);

router
.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createOneReview);

router.
route('/:id')
.get(reviewController.getOneReview)
.patch(authController.restrictTo('admin', 'user'), reviewController.updateReview)
.delete(authController.restrictTo('admin', 'user'), reviewController.deleteOneReview);


module.exports = router;