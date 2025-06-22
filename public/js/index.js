import { bookTour } from './stripe.js';
import { displaMap } from './leaflet.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';

const mapElement = document.getElementById('map');
const bookBtn = document.getElementById('book-tour');
const loginForm = document.querySelector('.form--login');
const logoutBnt = document.querySelector('.nav__el--logout');
const updateForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-password');

if (mapElement) {
  const locations = JSON.parse(mapElement.dataset.locations);
  displaMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBnt) logoutBnt.addEventListener('click', logout);

if (updateForm) {
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateSettings(form, 'data');
    location.reload();
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await new Promise((r) => setTimeout(r, 1500));
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    passwordForm.reset();
    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', async (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    await bookTour(tourId);
    e.target.textContent = 'Book tour now!';
  });
}
