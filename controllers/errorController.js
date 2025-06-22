import { AppError } from '../utils/appError.js';

function sendErrorDev(err, res, req) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: '404 not found',
    msg: err.message,
  });
}

function sendErrorProd(err, res, req) {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
}

function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

function handleDuplicateFieldsDB(err) {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 400);
}

const handleValidationErrorDB = (err) => new AppError(err.message, 400);

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleTokenExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

export function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';

  if (isDev) {
    sendErrorDev(err, res, req);
  } else if (isProd) {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, res, req);
  }
}
