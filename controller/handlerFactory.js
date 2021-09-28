const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');


exports.deleteOne = Model => {
  return catchAsync( async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found for this ID`, 404));
    };

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

exports.updateOne = Model => {
  return catchAsync( async (req, res, next) => {
    const doc = await Model.findByIdandUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError(`No document found for this ID`, 404));
    };

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
    
  });
};

exports.createOne = Model => {
  return catchAsync( async (req, res, next) => {
    const doc = await Model.create(req.body);


    if (!doc) {
      return next(new AppError('No document found for this ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync( async (req, res, next) => {
    let query = Model.findById(req.params.id);
    console.log('Populate with:',populateOptions);
    if (populateOptions) query.populate(populateOptions);
    const doc = await query;
    // console.log(doc);

    if (!doc) {
      // console.log('Tour:', doc);
      
      return next(new AppError('No doc found', 404));
    }

    console.log(doc.reviews);
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
});
};

exports.getAll = (Model, populateOptions) => {
  return catchAsync( async (req, res) => {
    let filter = {};
    if(req.params.tourId) filter = { tour: req.params.tourId};

      const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

        let populateQuery = features.query;
        if (populateOptions) features.query.populate(populateOptions);
  
      const doc = await features.query
      // console.log('New QUery: ', query());
      // console.log('Features query', features.query);
  
      res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
          data: doc
        }
      });
  });
};