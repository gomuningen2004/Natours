import express from 'express';
import * as viewController from '../controllers/viewController.js';
import * as authController from '../controllers/authController.js';

export const viewRouter = express.Router();

viewRouter.get('/', authController.isLoggedIn, viewController.getOverView);
viewRouter.get(
  '/tour/:tourSlug',
  authController.isLoggedIn,
  viewController.getTour
);
viewRouter.get(
  '/login',
  authController.isLoggedIn,
  viewController.getLoginPage
);
viewRouter.get('/me', authController.protect, viewController.getAccount);
viewRouter.get('/my-tours', authController.protect, viewController.getMyTours);
