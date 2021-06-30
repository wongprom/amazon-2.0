import { buffer } from 'micro';
import * as admin from 'firebase-admin';

//info Secure a connection to FIREBASE from the backend
const serviceAccount = require('../../../permissions.json');
// prevent dubbel initial of app
const app = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  : admin.app();

// establish connection to STRIPE
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

const fulfillOrder = async (session) => {
  console.log(
    '🚀 ~ file: webhook.js ~ line 19 ~ fulfillOrder ~ session',
    session
  );

  return app
    .firestore()
    .collection('users')
    .doc(session.metadata.email)
    .collection('orders')
    .doc(session.id)
    .set({
      amount: session.amount_total / 100,
      amount_shipping: session.total_details.amount_shipping / 100,
      images: JSON.parse(session.metadata.images),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log(`Success: Order ${session.id} had been added to DB`);
    });
};

export default async (req, res) => {
  if (req.method === 'POST') {
    const requestBuffer = await buffer(req);
    const payload = requestBuffer.toString();
    const sig = req.headers['stripe-signature'];

    let event;

    //verify that the EVENT posted came from STRIPE
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log('🚀 ~ file: webhook.js ~ line 28 ~ ERROR ==> ', err);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      //Fullfill the order...
      return fulfillOrder(session)
        .then(() => res.status(200))
        .catch((err) => res.status(400).send(`Webhook error: ${err.message}`));
    }
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
