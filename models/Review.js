// const User = require('./User');
// const 

const mongoose = require('mongoose');
const Tour = require('./Tour');


const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'This review must belong to a user']
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'This review must belong to a tour']
  },
  review: {
    type: String,
    required: ['true', 'Please provide a review'],
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reviewSchema.index({tour: 1, user: 1}, { unique: true});


// Static function to update the number of ratings and average ratings of a tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([

    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: {$sum: 1},
        avg: {$avg: '$rating'}
      },
    }
  
  ])
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avg
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// Calling the function to calculate the number of ratings and average ratings
// after saving in the database
reviewSchema.post('save', function(next) {
  this.constructor.calcAverageRatings(this.tour)
  // next();
});

// Middleware to get tour document when deleted or updated
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

// Middleware to update the fetched document 
reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  // .populate({
  //   path: 'tour',
  //   select: 'name'
  // })
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;