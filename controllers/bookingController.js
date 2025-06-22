import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import Stripe from 'stripe';
import { Tour } from '../models/tourModel.js';
import { catchAsync } from '../utils/catchAsync.js';
import { Booking } from '../models/bookingModel.js';
import * as factory from '../controllers/handlerFactory.js';
import { User } from '../models/userModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tour`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  res.status(200).json({ status: 'success', session });
});

export function webhookCheckout(req, res, next) {
  const sig = req.headers['stripe-signature'];
  let evt;

  try {
    evt = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (evt.type === 'checkout.session.complete')
    createBookingCheckout(evt.data.object);

  res.status(200).json({ received: true });
}

const createBookingCheckout = catchAsync(async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
});

export const getAllBookings = factory.getAll(Booking);
export const getBooking = factory.getOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
export const updateBooking = factory.updateOne(Booking);
