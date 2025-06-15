import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    // The frontend will now send the amount directly
    const { userId, planId, amount, currency = 'INR' } = await request.json();

    if (!userId || !planId || !amount) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields." }), { status: 400 });
    }
    
    // We create a simple order with the amount. Razorpay requires the amount in the smallest currency unit (e.g., paise).
    const options = {
      amount: amount * 100, // Convert rupees to paise
      currency,
      receipt: `receipt_order_${crypto.randomBytes(8).toString('hex')}`,
      notes: {
        userId: userId,
        planId: planId, // Pass the planId through for the webhook
      },
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
        throw new Error("Failed to create Razorpay order.");
    }

    // We send back the order details to the frontend
    return NextResponse.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
    });

  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
