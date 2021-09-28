const express = require('express');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');


const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', authController.protect, bookingController.checkoutSession);

router.use(authController.restrictTo('admin, lead-guide'));

router
  .route('/')
  .get(bookingController.getBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getOneBooking)
  .patch(bookingController.updateOneBooking)
  .delete(bookingController.deleteOneBooking);


module.exports = router;