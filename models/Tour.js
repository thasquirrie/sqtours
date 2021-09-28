const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./User');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name is needed'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have less than or equal to 40 characters'],
    minlength: [10, 'A tour must have at least 10 characters'],
    // validate: [validator.isAlpha, 'Tour name should be alphabetical characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'Tour duration is needed']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Tour group size is needed']
  },
  difficulty: {
    type: String,
    required: [true, 'Tour difficulty is needed'],
    enum: {
     values:  ['easy', 'medium', 'difficult'],
     message: 'Difficulty is easy, medium or difficult'
    }
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must be below 5'],
    set: val => Math.round(val * 10) / 10
  },
  price: {
    type: Number,
    required: [true, 'Tour price is needed']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price should be less than original price'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'Tour summary is needed']
  },
  description: {
    type: String,
    // required: [true, 'Tour description is needed'],
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'Tour cover image is needed']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number
  }
],
  guides: [
    {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
]
}, {
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});


tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
  select: '-__v'
});


// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower: true});
  next();
});

tourSchema.post('save', function(doc, next) {
  console.log(doc);
  next();
});

// tourSchema.pre('save', async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next()
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: {$ne: true}}).select('-__v -id');

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// tourSchema.pre(/^find/, function(next) {
//   this.select('-id');
//   next();
// })


tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});




// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
//   next();
// })



const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// let val;
//  const today = new Date().toDateString();
//  console.log(today);
//   const bday = new Date('2000-09-18').toDateString();
//   val = bday;
//   console.log(val)

