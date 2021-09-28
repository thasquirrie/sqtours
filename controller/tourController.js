const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/Tour.js');
const { query } = require('express');

const APIFeatures = require('../utils/apiFeatures');
const AppError = require('./../utils/appError');

const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// exports.checkBody = (req, res, next) => {
//   const name = req.body.name;
//   const price = req.body.price;
//   if (!name || !price) {
//     return res.status(400).send({
//       status: "fail",
//       message: "Bad request"
//     })
//   }
//   next();
// }

const multerStorage = multer.memoryStorage();


const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    const error = new AppError('File is not an image. Please upload only images.', 400);
    cb(error, false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log('All images:', req.files);

  if (!req.files.imageCover[0] || !req.files.images) {
    return next();
  }

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

    
    req.body.images= [];
    await Promise.all(
      req.files.images.map(async (image, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`
      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    })
  );


  next();
});




exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, difficulty, ratingsAverage, price, summary, description';
  next();
}

exports.aliasCheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price';
  req.query.fields = 'name, ratingsAverage, difficulty, summary, description, price';
  next();
}

exports.aliasLowPriceTours = (req, res, next) => {
  req.query.limit = '5';
  // req.query.sort = 'price[$lt]=1000';
  req.query.price = { lt: 1000 };
  req.query.fields = 'name, ratingsAverage, difficulty, summary, description, price';
  console.log('Sort:', req.query.sort);
  next();
}

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }
      },
      {
        $group: {
          _id: '$difficulty',
          numTour: { '$sum': 1 },
          numRating: { '$sum': '$ratingsAverage' },
          avgPrice: { '$avg': '$price' },
          avgRating: { '$avg': '$ratingsAverage' },
          minPrice: { '$min': '$price' },
          maxPrice: { '$max': '$price' }
        },
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    })

  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: 'Tour not found'
    });
  }
}

exports.getTourStartDates = async (req, res) => {
  try {
    const year = req.params.year;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        // $match: {ratingsAverage: {gte: 4.5}}
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { '$month': '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: '$name' }

        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $sort: { numTours: -1 }
      },
      // {
      //   $limit: 12
      // }
    ]);

    res.status(200).json({
      status: 'success',
      length: plan.length,
      data: {
        plan
      }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: 'Tour not found'
    });
  }
};

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if (!lng || !lat) {
    return next(new AppError('Please specify latitude and longitude points in the format lat,lng.', 400));
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
});

exports.getDistanceFromPoint = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(new AppError('Please specify latitude and longitude point in the format lat, lng', 400));
  }

  console.log(lat, lng);
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
});

exports.getAllTours = factory.getAll(Tour, { path: 'reviews' });
// exports.getAllTours = factory.getAll(Tour);
exports.getOneTour = factory.getOne(Tour, { path: 'reviews' });
// exports.getOneTour = factory.getOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);