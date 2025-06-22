import axios from 'axios';
import { showAlert } from './alerts';

export async function bookTour(tourId) {
  try {
    const res = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    if (res.status === 200) location.assign(res.data.session.url);
  } catch (err) {
    showAlert('error', err.message);
  }
}
