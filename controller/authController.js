const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/User');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// console.log(process.env.JWT_EXPIRES_IN);

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// const user = User.find({email: 'thasquirrie@gmail.com'});
// console.log('User:', user.name);
// const greetings = user.sayHello()
// console.log(greetings)

const createSignedToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // console.log(cookieOptions.expires)
  if (process.env.NODE_ENV === 'production') cookie.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo,
  });
  // http://localhost:3000/me
  const url = `${req.protocol}://${req.get('host')}/me`;

  console.log(url);
  new Email(newUser, url).sendWelcome();

  createSignedToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email and password', 401));
  }

  // 3)If everything is ok, send token
  createSignedToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  console.log('This route');
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //1) Check if a token exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log('Token:', token);
  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please log in to get authorized to access',
        401
      )
    );
  }
  // 2) Check if
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  const currentUser = await User.findById(decoded.id);
  // 3) Check if user exist
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exist', 401)
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'The password has recently been changed. Please log in again.',
        401
      )
    );
  }
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      // console.log('LocalUser:', res.locals.user);
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this operation', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Find user based on input email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('No user associated with the given email exists', 404)
    );
  }

  // console.log('User:', user);

  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //  3) Send it to user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  console.log(resetUrl);

  try {
    // await sendEmail({
    //   email: user.email,
    //   message,
    //   subject: 'Password Reset Token (Valid for only 10 mins)'
    // });

    new Email(user, resetUrl).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Token sent',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordTokenExpireTime = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'An error occurred while sending the email. Please try again later',
        500
      )
    );
  }

  // next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordTokenExpireTime: { $gt: Date.now() },
  });

  console.log('User:', user);
  // 2) If token has not expired and user exist, set the new password
  if (!user) {
    return next(new AppError('User does not exist or token has expired', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordTokenExpireTime = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSignedToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(req.params);
  // 1) Get user from the collection
  const { password, newPassword, confirmNewPassword } = req.body;
  // let user;
  const user = await User.findById(req.user.id).select('+password');
  console.log('User:', user.name);

  // 2) Check if the password input is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('The current password is incorrect', 401));
  }

  console.log('Passwords:', { password }, user.password);

  // 3) If password is correct, update password
  user.password = newPassword;
  user.confirmPassword = confirmNewPassword;
  await user.save();

  // 4) Log user in
  createSignedToken(user, 200, res);

  // const token = signToken(user.id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   message: 'Password updated successfully'
  // });
});

exports.logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
});
});
// exports.logout = catchAsync( async (req, res, next) => {
//   const user = await User.findById(req.user.id);
//   req.logout;
//   console.log('User: ', user);
//   console.log(`You have been logged out ${(user.name).toUpperCase()}`);

//   res.status(200).json({
//     status: 'success',
//     data: null
//   })
// });
