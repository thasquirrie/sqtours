const Tour = require('../models/Tour');
const User = require('../models/User');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  console.log('Results:', tours.length);

  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  console.log('Slug:', req.params.slug);
  const tour = await Tour.findOne({
    slug: req.params.slug
  }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  // const user = await User.findById(req.user.id);
  // console.log(user);

  if (!tour) {
    return next(new AppError('No tour with that name found!', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    // user
  });
});

exports.login = (req, res) => {
  res.status(200).render('login', {
    title: 'User Login Page'
  });
};


exports.signup = (req, res) => {
  res.status(200).render('signup', {
    title: 'User Signup Page'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My dashboard'
  });
}

exports.getMyTours = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id });
  console.log('Bookings:', bookings);

  const tourIds = bookings.map(booking => {
    return booking.tour
  });
  const tours = await Tour.find({ _id: { $in: tourIds } });
  console.log(tours);

  res.status(200).render('overview', {
    tours
  });
});

exports.getMyReviews = catchAsync( async (req, res, next) => {
  const user = await User.findById(req.user.id, {path: 'reviews'});
  console.log(user);
})

exports.addReview = catchAsync( async (req, res, next) => {
  const tour = await Tour.findOne({
    _id:  req.params.tourId
  })

  const userId = req.user.id;
  console.log(typeof userId);

  const tourId = tour.id
  res.status(200).render('review', {
    title: `Add review on ${tour.name} tour`,
    tourId,
    userId
  });
})