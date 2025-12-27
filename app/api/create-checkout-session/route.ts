import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!process.env.STRIPE_PRICE_ID) {
        return new NextResponse("Missing STRIPE_PRICE_ID", { status: 500 });
    }

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
}
