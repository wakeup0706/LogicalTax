import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers(); // Prepare for Next.js 15+ if needed, or strict typing
    const signature = headersList.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = event.data.object as Stripe.Subscription;

    try {
        if (event.type === 'checkout.session.completed') {
            const subscriptionId = session.subscription as string;
            const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

            // We assume userId is passed in metadata during checkout creation
            const userId = session.metadata?.userId;

            if (userId) {
                await supabaseAdmin.from('subscriptions').upsert({
                    id: subscriptionId,
                    user_id: userId,
                    status: stripeSubscription.status,
                    price_id: stripeSubscription.items.data[0].price.id,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                });

                // Update customer ID in users table
                if (session.customer) {
                    await supabaseAdmin.from('users').update({
                        stripe_customer_id: session.customer as string
                    }).eq('id', userId);
                }
            }
        } else if (event.type === 'customer.subscription.updated') {
            // For updates, we just update the specific fields. 
            // Upsert might fail if we don't assume user_id is present in this event object's metadata.
            // So we use update() which only changes provided fields for the existing ID.
            await supabaseAdmin.from('subscriptions').update({
                status: subscription.status,
                price_id: subscription.items.data[0].price.id,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }).eq('id', subscription.id);

        } else if (event.type === 'customer.subscription.deleted') {
            await supabaseAdmin.from('subscriptions').update({
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }).eq('id', subscription.id);
        }
    } catch (err: any) {
        console.error('Error handling webhook event:', err.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
