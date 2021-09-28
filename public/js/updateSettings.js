import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  // let url = type => 'password' ?
  // 'http://localhost:3000/api/v1/users/updateMyPassword' :
  // 'http://localhost:3000/api/v1/users/updateMe'

  let url = '';
  if (type === 'password') {
    url = `/api/v1/users/updateMyPassword`;
  } else {
    url = `/api/v1/users/updateMe`;
  }
  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    console.log('Results:', res.data);

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
