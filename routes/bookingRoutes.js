import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as authController from '../controllers/authController.js';

const bookingRouter = express.Router();

bookingRouter.use(authController.protect);
bookingRouter.get(
  '/checkout-session/:tourId',
  bookingController.getCheckoutSession
);

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter.route('/').get(bookingController.getAllBookings);

bookingRouter
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

export default bookingRouter;
