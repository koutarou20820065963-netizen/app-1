import Stripe from 'stripe';

let stripe;

if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    // Mock Stripe
    stripe = {
        checkout: {
            sessions: {
                create: async (params) => {
                    console.log("[MockStripe] Create Session", params);
                    return { url: 'https://example.com/checkout-mock' };
                }
            }
        },
        webhooks: {
            constructEvent: () => ({ type: 'mock' })
        }
    };
}

export default stripe;
