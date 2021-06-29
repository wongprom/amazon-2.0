const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async (req, res, next) => {
  const { items, body } = req.body;
  console.log('🚀 ~ file: create-checkout-session.js ~ line 5 ~ body', body);
  console.log('🚀 ~ file: create-checkout-session.js ~ line 5 ~ items', items);
};
