const AppError = require('./../utils/appError');

const handleErrorDB = err => {
  console.log('Error from handleErrorDB: ', err);
  const message = `Invalid ${err.path} : ${err.value}`;

  new AppError(message, 400);
}

const handleJWTError = err => new AppError('Invalid token. Please log in again!', 401);
const handleTokenExpiredError = err => new AppError('Expired Token. Please log in again to get another token', 401);

const sendErrorDev = (err, req, res) => {
  // console.log(new AppError(err.message, 400))
  // console.log(err.isOperational);
if (req.originalUrl.startsWith('/api')) {
  res.status(err.statusCode).json({
    status: err.status || 'error',
    message: err.message,
    stack: err.stack,
    error: err
  });
} else {
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
}
  
};

const sendErrorProd = (err, req, res) => {
// console.log('This is too good');
// console.log(err.isOperational);
  if (err.isOperational) {
    if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode).json({
        status: err.status || 'error',
        message: err.message
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message
      });
    }
  } else {

    console.error('Error:', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }

};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status;
  // console.log('Error Status code:', err.statusCdde);
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production ') {
    let error = {...err};
    error.message = err.message
    // console.log('Error from Production block: ', error);
    if (error.name === 'castError') error = handleErrorDB(error);
    if (error.name === 'JsonWebTokenError' ) error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError(error);

    sendErrorProd(error, req, res);
  }
};