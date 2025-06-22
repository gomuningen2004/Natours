import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';
import { User } from '../models/userModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { Email } from '../utils/email.js';
import mongoose from 'mongoose';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendTokenResponse = (user, statusCode, res, req) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  const userSafe = user.toObject ? user.toObject() : { ...user };
  delete userSafe.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userSafe,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  sendTokenResponse(newUser, 201, res, req);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = mongoose.sanitizeFilter(req.body);

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401));
  }

  sendTokenResponse(user, 200, res, req);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Password is wrong! Please try again!', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  sendTokenResponse(user, 200, res, req);
});

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User no longer exists.', 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password recently changed. Please log in again.', 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export async function isLoggedIn(req, res, next) {
  try {
    if (req.cookies.jwt) {
      const token = req.cookies.jwt;
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser || currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
}

export function logout(req, res) {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
}

export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
}

export const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = user.createPassResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Error sending the email. Please try again later.', 400)
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, req);
});
