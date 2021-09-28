const Review = require('../models/Review');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');




exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  
  next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getOneReview = factory.getOne(Review);
exports.createOneReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteOneReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync( async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = {tour: req.params.tourId}

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   })
// });

