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

    // Determine base URL safely
    let baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
        const protocol = req.headers.get('x-forwarded-proto') ?? 'http';
        const host = req.headers.get('host') ?? 'localhost:3000';
        baseUrl = `${protocol}://${host}`;
    } else if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
    }

    // REAL STRIPE CHECKOUT
    try {
        // Use STRIPE_PRICE_ID if available, otherwise use inline price_data
        const lineItems = process.env.STRIPE_PRICE_ID
            ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
            : [{
                price_data: {
                    currency: 'jpy',
                    product_data: {
                        name: 'LogicalTax Pro',
                        description: '税務判断をサポートする月額サブスクリプション',
                    },
                    unit_amount: 10000, // ¥10,000
                    recurring: { interval: 'month' as const },
                },
                quantity: 1,
            }];

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: lineItems,
            metadata: {
                userId: session.user.id,
            },
            customer_email: session.user.email || undefined,
            success_url: `${baseUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout?canceled=true`,
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
