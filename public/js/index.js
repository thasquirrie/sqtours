import '@babel/polyfill';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { addReview } from './addReview';

const map = document.querySelector('#map');
const loginForm = document.querySelector('#login');
const signupForm = document.querySelector('#signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataBtn = document.querySelector('.form-user-data');
const updatePasswordBtn = document.querySelector('.form-user-settings');
const bookBtn = document.querySelector('#book-tour');
const reviewForm = document.querySelector('#review');
const reviewBtn = document.querySelector('.float');

let tourId;

if (reviewBtn) {
  reviewBtn.addEventListener('click', (e) => {
    tourId = e.target;
  });
}

if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    console.log('Hello World');
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });
}

if (reviewForm) {
  return reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const tourId = document.querySelector('#tour_id').value;
    const userId = document.querySelector('#user_id').value;
    const rating = parseInt(document.querySelector('#rating').value);
    const review = document.querySelector('#reviews').value;
    console.log({ tourId, userId, rating, review });
    console.log(review);
    addReview(tourId, userId, rating, review);

    console.log(window.location.href);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('MOHBAD');
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirmPassword').value;

    signup(name, email, password, confirmPassword);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (updateDataBtn) {
  updateDataBtn.addEventListener('submit', (e) => {
    e.preventDefault();
    // const name = document.querySelector('#name').value;
    // const email = document.querySelector('#email').value;
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (updatePasswordBtn) {
  updatePasswordBtn.addEventListener('submit', (e) => {
    e.preventDefault();
    document.querySelector('.save--password').textContent = 'Updating...';
    const password = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const confirmNewPassword = document.querySelector('#password-confirm')
      .value;

    updateSettings({ password, newPassword, confirmNewPassword }, 'password');
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
    document.querySelector('.save--password').textContent = 'Save password';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
