import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  console.log('Port:', process.env.PORT);
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/users/login`,
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');

      window.setTimeout(() => {
        // location.assign('/');
        location.replace(document.referrer);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    console.log('Hello from here');
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    console.log(res.data);

    // if (res.data.status === 'success') location.reload(true);

    if (res.data.status === 'success') {
      showAlert('success', 'Logged out!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    console.log('Hello');
    showAlert('error', 'Error logging out! Try again!');
  }
};
