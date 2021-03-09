//error handlers are error controllerts
//global error handler

const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //opetation, trusted error - send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error - dont know details
  } else {
    //log to console
    //console.error('Error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

//mongoose invalid ID error
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  //the error is a duplicate field error
  //err.code = 11000
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  //object.values are the objects on each of the errors objects,
  //which are contained within the error object.
  //Each object on the main error object is like name, difficulty, etc... anything that has a validation error on it
  const errors = Object.values(err.errors).map((el) => el.message);
  //console.log(Object.values(err.errors));
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token, please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired, please log in again', 401);
};

module.exports = (err, req, res, next) => {
  //500 is internal server error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //console.log('prod', err.value, err.name, err.path);
    //dont want to directly modify the original err, bad practice
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    //let error = { ...err };
    //Object.assign() copies inherited properties/class info, which we need for the error's name
    //spreading does NOT copy this info, hence why we cant get the name property
    let error = Object.assign(err);
    //console.log(error.constructor.name);
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    //duplicate fields code
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};
