import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';

const userRouter = express.Router();

userRouter.get('/logout', authController.logout);
userRouter.post('/login', authController.login);
userRouter.post('/signup', authController.signup);
userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

userRouter.use(authController.protect);

userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizePhoto,
  userController.updateMe
);
userRouter.delete('/deleteMe', userController.deleteMe);
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.patch('/updateMyPassword', authController.updatePassword);

userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default userRouter;
