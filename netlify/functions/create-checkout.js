const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { cart, shipping, shippingCost, customer } = body;

  try {
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: 1,
    }));

    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `Transport: ${shipping}` },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['bancontact', 'card'],
      line_items,
      mode: 'payment',
      success_url: 'https://tiltcraft.eu/?payment=success',
      cancel_url: 'https://tiltcraft.eu/?payment=cancelled',
      customer_email: customer.email,
      metadata: {
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: `${customer.address}, ${customer.zip} ${customer.city}, ${customer.country}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
