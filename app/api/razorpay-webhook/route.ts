import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase-admin'; // We will create this admin file next

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  try {
    const text = await request.text();
    const signature = request.headers.get('x-razorpay-signature')!;

    // 1. Verify the webhook signature for security
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(text);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    // 2. Parse the event payload
    const event = JSON.parse(text);

    // 3. Handle the 'subscription.charged' event
    if (event.event === 'subscription.charged') {
      const subscription = event.payload.subscription.entity;
      const userId = subscription.notes.userId;

      if (userId) {
        // 4. Update the user's document in Firestore to grant "Pro" access
        const userRef = db.collection('users').doc(userId);
        await userRef.set({ isPro: true }, { merge: true });
        console.log(`Successfully upgraded user ${userId} to Pro.`);
      }
    }

    return new NextResponse('Webhook processed', { status: 200 });

  } catch (err: any) {
    console.error('Error processing Razorpay webhook:', err);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
