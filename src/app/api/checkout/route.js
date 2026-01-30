import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import stripe from '@/lib/server/stripe';

// Price IDs (Replace with real ones or Env Vars)
const PRICES = {
    small: 'price_dummy_small',
    medium: 'price_dummy_medium'
};

const CREDITS = {
    small: 100,
    medium: 500
};

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { packageId } = await req.json();
        if (!PRICES[packageId]) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${CREDITS[packageId]} Credits`,
                        },
                        unit_amount: packageId === 'small' ? 500 : 2000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?canceled=true`,
            metadata: {
                userId,
                credits: CREDITS[packageId]
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Error creating session' }, { status: 500 });
    }
}
