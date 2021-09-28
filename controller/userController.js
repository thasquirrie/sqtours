const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUploadPhoto = catchAsync( async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;


  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


// Function to filter unwanted fields from the body of request
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    };
  });
  return newObj;
};


exports.inactiveUsers = (req, res, next) => {
  // req.query.sort = 
}

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  // 1) Make sure the route doesn't allow password updates
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('This route does not support updating passwords. Use the updatePassword link for that.', 400));
    console.log('This is unknown')
  }

  // 2) Filter out unwanted fields to be updated 
  const filteredFields = filterObj(req.body, 'name', 'email');
  if (req.file) filteredFields.photo = req.file.filename;
  console.log(req.file.filename)

  console.log(filteredFields.photo);

  // 3) Update user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredFields, {
    new: true,
    runValidators: true
  });


  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.deleteMe = catchAsync(async (req, res, next) => {
  console.log(req.user.id);
  const user = await User.findOneAndUpdate(req.user.id, {
    active: false
  });

  res.status(204).json({
    status: 'success',
    data: null
  });
});


exports.getAllUsers = factory.getAll(User);
exports.createUser = factory.createOne(User);
// exports.getOneUser = factory.getOne(User, {path: 'reviews'});
exports.getOneUser = factory.getOne(User, {
  path: 'reviews bookings', 
  // select: '-__v'
});
// The updateOne route is not used to update password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);