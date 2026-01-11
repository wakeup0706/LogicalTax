import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// This endpoint is called when user returns from Stripe with ?success=true
// It creates a subscription record so user can access Q&A
// Note: In production, this should be handled by webhook for reliability
// This endpoint checks if the user has an active subscription
// Used by the client to poll for status after a Stripe Checkout success
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const { session_id } = body;

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // 1. First, check DB for active subscription (Fastest)
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .in('status', ['active', 'trialing'])
            .maybeSingle();

        if (sub) {
            return NextResponse.json({ active: true, status: sub.status });
        }

        // 2. Fallback: If DB not ready, check Stripe directly using session_id (Reliable)
        if (session_id) {
            console.log('Checking Stripe directly for session:', session_id);
            const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

            if (checkoutSession.payment_status === 'paid' && checkoutSession.subscription) {
                const subscriptionId = checkoutSession.subscription as string;
                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

                // Manually sync to DB immediately
                await supabaseAdmin.from('subscriptions').upsert({
                    id: subscriptionId,
                    user_id: session.user.id, // User ID is explicitly trusted from auth session here or metadata
                    status: stripeSubscription.status,
                    price_id: stripeSubscription.items.data[0].price.id,
                    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
                    current_period_end: stripeSubscription.items.data[0].current_period_end
                        ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
                        : null,
                });

                return NextResponse.json({ active: true, status: stripeSubscription.status });
            }
        }

        return NextResponse.json({ active: false, status: 'none' });

    } catch (error: any) {
        console.error('Error checking subscription status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
