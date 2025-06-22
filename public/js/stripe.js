import axios from 'axios';
import { showAlert } from './alerts';

export async function bookTour(tourId) {
  try {
    const res = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`
    );

    if (res.status === 200) location.assign(res.data.session.url);
  } catch (err) {
    showAlert('error', err.message);
  }
}
