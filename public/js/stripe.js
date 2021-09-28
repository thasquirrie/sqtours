import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51HFhdkHX6wYNdksNPbtAO7lrbqGRgNdKxGjKRqnqIV7R79xtMI5D90Xdy1zlbeVDNgtXIdrmNGM17786zeYO95Pr00xmsZlcG6'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    console.log(session);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
