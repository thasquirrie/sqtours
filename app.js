const path = require('path');
const morgan = require('morgan');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');


const app = express();

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));




// Load Routes

  const tourRouter = require('./routes/tourRoutes');
  const userRouter = require('./routes/userRoutes');
  const reviewRouter = require('./routes/reviewRoutes');
  const viewsRouter = require('./routes/viewsRoutes');
  const bookingRouter = require('./routes/bookingRoutes');

  // Middlewares
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(helmet());

  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser()); 

  // Data Sanitization against NoSql query injection
  app.use(mongoSanitize());

  // Data sanitization
  app.use(xss());

  // Preventing Data Parameter Pollution
  app.use(hpp({
    whitelist: ['duration', 'averageRating', 'price']
  }));


  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP. Try again in one hour'
  });

  app.use('/api', limiter);

  console.log(`${process.env.NODE_ENV.trim()} is what we have`);

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }


  app.use((req, res, next) => {
    req.requestTime = new Date().toLocaleString();
    // console.log(req.cookies);
    next();
  });




  // Route Handlers

  // Routes
  // app.get('/', (req, res) => {
  //   res.status(200).send('Welcome');
  // });

  app.use('/', viewsRouter);
  app.use('/api/v1/tours', tourRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/bookings/',bookingRouter );

  app.all('*', (req, res, next) => {
    // res.status(404).json({
    //   status: 'fail',
    //   message: `The page ${req.originalUrl} was not found on this server`
    // });

    // const err = new Error(`The page ${req.originalUrl} was not found on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`The page ${req.originalUrl} was not found on this server`, 404));
  });

  app.use(globalErrorHandler);

  module.exports = app;


// console.log(new Date().toLocaleTimeString());