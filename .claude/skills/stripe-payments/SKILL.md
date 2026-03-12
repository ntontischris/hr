---
name: stripe-payments
description: Stripe integration patterns including Checkout, webhooks, subscriptions, customer portal, payment intents, and billing. Use when user mentions Stripe, payments, subscriptions, checkout, billing, pricing, webhooks, or payment processing.
---

# Stripe Payment Patterns (Next.js + Supabase)

## Setup
```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

## Checkout Session (One-time or Subscription)
```typescript
// app/api/checkout/route.ts
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await request.json()

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',  // or 'payment' for one-time
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
```

## Webhook Handler (CRITICAL)
```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutComplete(session)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionChange(subscription)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailed(invoice)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) return

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      stripe_price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Notify user, update status, etc.
  const customerId = invoice.customer as string
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId)
}
```

## Customer Portal (Manage Subscription)
```typescript
// app/api/portal/route.ts
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user!.id)
    .single()

  const session = await stripe.billingPortal.sessions.create({
    customer: profile!.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
```

## Database Schema (Supabase)
```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Add stripe_customer_id to profiles
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
```

## Helper: Check Subscription Status
```typescript
// lib/subscription.ts
export async function getUserSubscription(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return data
}

export function isSubscribed(subscription: Subscription | null): boolean {
  if (!subscription) return false
  return subscription.status === 'active' 
    && new Date(subscription.current_period_end) > new Date()
}
```

## Environment Variables Needed
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Common Mistakes
- NEVER verify webhooks without signature check — ALWAYS use constructEvent
- NEVER trust client-side for payment status — ALWAYS use webhooks
- ALWAYS use supabaseAdmin (service role) in webhooks — no user session exists
- ALWAYS store subscription status in YOUR database — don't call Stripe API on every page load
- ALWAYS handle invoice.payment_failed — subscriptions can fail silently
- DON'T hardcode price IDs — store in env vars or config
- TEST webhooks locally with: stripe listen --forward-to localhost:3000/api/webhooks/stripe
