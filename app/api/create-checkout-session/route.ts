import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if Stripe keys are configured
    const hasPriceId = !!process.env.STRIPE_PRICE_ID;
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

    // DUMMY MODE: If Stripe is not fully configured, simulate successful payment
    if (!hasPriceId || !hasWebhookSecret) {
        console.log('🧪 DUMMY MODE: Simulating payment success for user:', session.user.id);

        // Create a dummy subscription in the database
        const dummySubId = `sub_dummy_${Date.now()}`;
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now

        await supabaseAdmin.from('subscriptions').upsert({
            id: dummySubId,
            user_id: session.user.id,
            status: 'active',
            price_id: 'price_dummy',
            cancel_at_period_end: false,
            current_period_end: currentPeriodEnd.toISOString(),
        });

        return NextResponse.json({
            // Return a URL to simulate the real Stripe flow
            url: `${process.env.NEXTAUTH_URL}/dummy-payment`
        });
    }

    // REAL STRIPE MODE
    try {
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: session.user.id,
            },
            customer_email: session.user.email || undefined,
            success_url: `${process.env.NEXTAUTH_URL}/qa?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/checkout?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
