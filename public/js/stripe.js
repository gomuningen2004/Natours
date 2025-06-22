import axios from 'axios';
import { showAlert } from './alerts';
import Stripe from 'stripe';
const stripe = new Stripe(
  'pk_test_51RcWWzBIafnJNBuK06NQczUYFfsViHZ3zSot0rPsvz2Lnfjun4Kfbqw4DcvSnTxNuWkLU2XXQCAAS8IHDxaLRX0R00qQJf9NSc'
);

export async function bookTour(tourId) {
  try {
    const res = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    if (res.status === 200) location.assign(res.data.session.url);
  } catch (err) {
    showAlert('error', err.message);
  }
}
