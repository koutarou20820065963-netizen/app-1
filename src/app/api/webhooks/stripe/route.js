import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/server/stripe';
import { addTransaction } from '@/lib/server/credit';

export async function POST(req) {
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, credits } = session.metadata;

        if (userId && credits) {
            await addTransaction(userId, parseInt(credits), 'purchase', 'stripe', { sessionId: session.id });
        }
    }

    return NextResponse.json({ received: true });
}
