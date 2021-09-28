const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.checkoutSession = catchAsync( async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('No tour is associated with this ID', 404));
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
     client_reference_id: req.params.tourId,
     line_items: [
       {
         name: `${tour.name} Tour`,
         description: tour.summary,
         images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
         amount: tour.price * 100,
         currency: 'usd',
         quantity: 1
       }
     ]
  });

  console.log(session.success_url);

  res.status(200).json({
    status: 'success',
    session
  });
});


exports.createBookingCheckout = catchAsync( async (req, res, next) => {
  const {tour, user, price} = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);

  // next();
});

exports.getBookings = factory.getAll();
exports.getOneBooking = factory.getOne();
exports.createBooking = factory.createOne();
exports.updateOneBooking = factory.updateOne();
exports.deleteOneBooking = factory.deleteOne()