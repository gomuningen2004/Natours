import xss from 'xss';
import sharp from 'sharp';
import multer from 'multer';
import { User } from '../models/userModel.js';
import * as factory from './handlerFactory.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

const multerStorage = multer.memoryStorage();

function multerFilter(req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload image only', 400), false);
  }
}

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single('photo');

export const resizePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

function filterObject(obj, ...allowedFields) {
  const filtered = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filtered[key] = xss(obj[key]);
  });

  return filtered;
}

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const deleteUser = factory.deleteOne(User);
export const updateUser = factory.updateOne(User);

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates.', 400));
  }

  const filteredBody = filterObject(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export function createUser(req, res) {
  res.status(500).json({
    status: 'error',
    message: 'Please use the signup route',
  });
}

export function getMe(req, res, next) {
  req.params.is = req.user.id;
  next();
}
