# ReqSploit - Stripe Integration Setup Guide

Complete guide to configure Stripe billing for ReqSploit.

## Overview

ReqSploit uses Stripe for subscription management with three plans:
- **FREE**: $0/month - 10K AI tokens
- **PRO**: $29/month - 100K AI tokens + advanced features
- **ENTERPRISE**: $99/month - 500K AI tokens + team collaboration

## Prerequisites

- Stripe account (create at [stripe.com](https://stripe.com))
- Stripe CLI for webhook testing (optional but recommended)

## Step 1: Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with your email
3. Verify your email address
4. Complete business information

## Step 2: Get API Keys

### Test Mode Keys (Development)

1. **Navigate to API Keys**:
   - Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   - Or: Dashboard → Developers → API keys

2. **Get Secret Key**:
   - Look for "Secret key" (starts with `sk_test_`)
   - Click "Reveal test key"
   - Copy the key
   - Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`

3. **Get Publishable Key** (for frontend - optional):
   - Look for "Publishable key" (starts with `pk_test_`)
   - Copy the key (used if you add client-side Stripe elements)

### Production Keys (When Ready)

Same process but use [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

## Step 3: Create Products and Prices

### Option A: Using Stripe Dashboard (Recommended for First Time)

1. **Navigate to Products**:
   - Go to [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
   - Or: Dashboard → Product Catalog → Products

2. **Create PRO Plan Product**:
   - Click "+ Add product"
   - Name: "ReqSploit Pro"
   - Description: "Professional pentesting with AI analysis"
   - Pricing model: "Standard pricing"
   - Price: $29.00
   - Billing period: "Monthly"
   - Click "Save product"

3. **Copy PRO Price ID**:
   - After creating, click on the product
   - Under "Pricing", you'll see the price (starts with `price_`)
   - Copy this ID
   - Add to `.env`: `STRIPE_PRICE_PRO=price_...`

4. **Create ENTERPRISE Plan Product**:
   - Repeat steps for Enterprise plan
   - Name: "ReqSploit Enterprise"
   - Description: "Enterprise security testing with team collaboration"
   - Price: $99.00
   - Billing period: "Monthly"
   - Copy price ID → `.env`: `STRIPE_PRICE_ENTERPRISE=price_...`

### Option B: Using Stripe CLI

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create PRO product & price
stripe products create \
  --name="ReqSploit Pro" \
  --description="Professional pentesting with AI analysis"

# Note the product ID, then create price
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Create ENTERPRISE product & price
stripe products create \
  --name="ReqSploit Enterprise" \
  --description="Enterprise security testing"

stripe prices create \
  --product=prod_YYYYY \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=month
```

## Step 4: Configure Webhooks

Webhooks are **CRITICAL** for subscription updates, cancellations, and payment failures.

### Development Setup (Local Testing)

1. **Install Stripe CLI** (if not already):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/billing/webhook
   ```

4. **Copy Webhook Secret**:
   - CLI will output: `Your webhook signing secret is whsec_...`
   - Copy this secret
   - Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

5. **Keep CLI Running**:
   - Leave the terminal open while developing
   - Webhooks will be forwarded to your local backend

### Production Setup

1. **Navigate to Webhooks**:
   - Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
   - Or: Dashboard → Developers → Webhooks

2. **Add Endpoint**:
   - Click "+ Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/billing/webhook`
   - Description: "ReqSploit Production Webhooks"

3. **Select Events to Listen**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Get Webhook Secret**:
   - After creating, click on the webhook endpoint
   - Under "Signing secret", click "Reveal"
   - Copy the secret (starts with `whsec_`)
   - Add to production `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Step 5: Test Webhooks

### Using Stripe CLI (Development)

```bash
# In one terminal, run the webhook listener
stripe listen --forward-to http://localhost:3000/api/billing/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Using Stripe Dashboard

1. Go to [https://dashboard.stripe.com/test/events](https://dashboard.stripe.com/test/events)
2. Click "Send test webhook"
3. Select event type (e.g., `checkout.session.completed`)
4. Click "Send test event"
5. Check your backend logs for webhook processing

## Step 6: Test Payment Flow

### Test Cards (Development Mode)

Stripe provides test cards that simulate different scenarios:

**Success**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline**:
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure)**:
- Card: `4000 0025 0000 3155`

### Full Test Flow

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Create Account**:
   - Go to `http://localhost:5173`
   - Sign up with test email

4. **Navigate to Pricing**:
   - Click "Upgrade" or go to `/pricing`

5. **Select PRO Plan**:
   - Click "Upgrade Now" on PRO plan
   - You'll be redirected to Stripe Checkout

6. **Complete Payment**:
   - Enter test card: `4242 4242 4242 4242`
   - Enter any future expiry, CVC, ZIP
   - Click "Subscribe"

7. **Verify Success**:
   - You should be redirected to `/billing/success`
   - Check backend logs for webhook processing
   - Verify user plan is updated in database

8. **Check Stripe Dashboard**:
   - Go to [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
   - You should see the successful payment
   - Go to Subscriptions to see the active subscription

## Step 7: Customer Portal Setup

The Customer Portal allows users to manage their subscriptions, update payment methods, and view invoices.

1. **Navigate to Customer Portal**:
   - Go to [https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)
   - Or: Dashboard → Settings → Billing → Customer portal

2. **Enable Portal**:
   - Toggle "Activate test link" (for test mode)

3. **Configure Features** (Optional):
   - Allow customers to update payment methods ✓
   - Allow customers to cancel subscriptions ✓
   - Allow customers to switch plans ✓
   - Allow customers to view invoice history ✓

4. **Test Portal**:
   - From frontend, go to Settings → Billing
   - Click "Manage Payment Method"
   - You'll be redirected to Stripe Customer Portal

## Environment Variables Summary

Your `.env` file should contain:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# Frontend URL (for success/cancel redirects)
FRONTEND_URL=http://localhost:5173
```

## Security Best Practices

### Development

1. **Use Test Mode**:
   - Always use test keys (starts with `sk_test_`)
   - Never commit real API keys to git

2. **Webhook Secrets**:
   - Store webhook secret in `.env`, never hardcode
   - Use different secrets for dev/production

3. **Environment Variables**:
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template

### Production

1. **Activate Live Mode**:
   - Go to [https://dashboard.stripe.com/account](https://dashboard.stripe.com/account)
   - Complete business verification
   - Enable live mode

2. **Use Live Keys**:
   - Get live API keys (starts with `sk_live_`)
   - Update production `.env`

3. **HTTPS Only**:
   - **CRITICAL**: Stripe requires HTTPS for production webhooks
   - Never use HTTP in production

4. **IP Allowlisting** (Optional):
   - Restrict webhook IPs in firewall
   - Stripe webhook IPs: [https://stripe.com/docs/ips](https://stripe.com/docs/ips)

5. **Monitoring**:
   - Monitor webhook delivery in Stripe Dashboard
   - Set up alerts for failed webhooks
   - Log all webhook events

## Troubleshooting

### Issue: "Invalid API Key"

**Cause**: Wrong or expired API key.

**Solution**:
1. Verify key in `.env` matches Dashboard
2. Check you're using test key in test mode (and vice versa)
3. Regenerate key if compromised

### Issue: "No such price: price_..."

**Cause**: Price ID doesn't exist or is from different mode.

**Solution**:
1. Verify price ID in Stripe Dashboard
2. Check you're in correct mode (test vs live)
3. Recreate product/price if necessary

### Issue: Webhook signature verification failed

**Cause**: Webhook secret mismatch or body modification.

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches dashboard/CLI
2. Check express is using `raw` body for webhook route (already configured)
3. Ensure no middleware is modifying request body

### Issue: Checkout session expires immediately

**Cause**: Time sync issues or network delays.

**Solution**:
1. Check system time is correct
2. Verify backend URL is reachable
3. Check for firewall blocking Stripe IPs

### Issue: Subscription not updating after payment

**Cause**: Webhooks not being received or processed.

**Solution**:
1. Check webhook endpoint is publicly accessible (production)
2. Verify webhook secret is correct
3. Check backend logs for webhook processing errors
4. Test webhook delivery in Stripe Dashboard

## Testing Checklist

- [ ] Test cards work in Checkout
- [ ] Successful payment creates subscription in database
- [ ] User plan is updated after payment
- [ ] Webhooks are being received and processed
- [ ] Customer Portal opens correctly
- [ ] Subscription cancellation works
- [ ] Reactivation works
- [ ] Failed payment is handled gracefully
- [ ] Invoice emails are sent (Stripe setting)

## Production Deployment Checklist

- [ ] Business verification completed on Stripe
- [ ] Live API keys configured
- [ ] Live products and prices created
- [ ] Production webhook endpoint configured (HTTPS)
- [ ] Webhook secret updated for production
- [ ] Customer Portal configured
- [ ] Tax settings configured (if applicable)
- [ ] Email notifications enabled
- [ ] Monitoring and alerts set up
- [ ] Test payment flow in production
- [ ] Document support procedures

## Resources

- **Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **Stripe Docs**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe CLI**: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
- **Test Cards**: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- **Webhooks**: [https://stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)
- **Customer Portal**: [https://stripe.com/docs/billing/subscriptions/integrating-customer-portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

## Support

If you encounter issues:
1. Check Stripe Dashboard logs
2. Review backend application logs
3. Test webhooks using Stripe CLI
4. Contact Stripe Support (very responsive!)
