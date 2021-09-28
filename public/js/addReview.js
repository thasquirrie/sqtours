import axios from 'axios';
import { showAlert } from './alert';

// console.log(process.env.DATABASE);

export const addReview = async (tourId, userId, rating, review) => {
  // const tourID = req.params.tourId;
  // console.log(tourID);
  try {
    console.log('Hello');
    const res = await axios({
      method: 'POST',
      url: `/api/v1/tours/${tourId}/reviews/`,
      data: {
        tourId,
        userId,
        rating,
        review,
      },
    });

    console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Review saved successfully!');

      window.setTimeout(() => {
        // location.assign('/api/v1/tours/tourId');
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
