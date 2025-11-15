/**
 * BillingService - Stripe integration for subscription management
 *
 * Features:
 * - Create checkout sessions for plan upgrades
 * - Handle Stripe webhooks for subscription events
 * - Manage subscription lifecycle (create, update, cancel)
 * - Customer portal access
 * - Invoice management
 */

import { PrismaClient, Plan, SubscriptionStatus, User } from '@prisma/client';
import Stripe from 'stripe';

interface CheckoutSessionInput {
  userId: string;
  plan: Plan;
  successUrl: string;
  cancelUrl: string;
}

interface PortalSessionInput {
  userId: string;
  returnUrl: string;
}

export class BillingService {
  private stripe: Stripe;

  constructor(private prisma: PrismaClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  /**
   * Get Stripe price IDs from environment
   */
  private getPriceId(plan: Plan): string {
    const priceIds: Record<Plan, string> = {
      FREE: '', // No price for free plan
      PRO: process.env.STRIPE_PRICE_PRO || '',
      ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || '',
    };

    const priceId = priceIds[plan];
    if (!priceId && plan !== 'FREE') {
      throw new Error(`Stripe price ID not configured for plan: ${plan}`);
    }

    return priceId;
  }

  /**
   * Create Stripe checkout session for plan upgrade
   */
  async createCheckoutSession(input: CheckoutSessionInput): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has this plan or higher
    if (user.plan === input.plan) {
      throw new Error('User already has this plan');
    }

    // Get or create Stripe customer
    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Create or update subscription record
      await this.prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: user.plan,
          stripeCustomerId: customerId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        update: {
          stripeCustomerId: customerId,
        },
      });
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.getPriceId(input.plan),
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: user.id,
        plan: input.plan,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return session.url!;
  }

  /**
   * Create customer portal session for subscription management
   */
  async createPortalSession(input: PortalSessionInput): Promise<string> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: input.userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: input.returnUrl,
    });

    return session.url;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as Plan;

    if (!userId || !plan) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Update user plan and subscription
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { plan },
      }),
      this.prisma.subscription.update({
        where: { userId },
        data: {
          plan,
          stripeSubscriptionId: session.subscription as string,
          status: 'ACTIVE',
        },
      }),
    ]);

    console.log(`✅ User ${userId} upgraded to ${plan}`);
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string;
    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!dbSubscription) {
      console.error('Subscription not found for customer:', customerId);
      return;
    }

    await this.prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    console.log(`✅ Subscription created: ${subscription.id}`);
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Determine plan from Stripe subscription
    const plan = this.getPlanFromSubscription(subscription);

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: this.mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan,
        },
      }),
      this.prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { plan },
      }),
    ]);

    console.log(`✅ Subscription updated: ${subscription.id} → ${plan}`);
  }

  /**
   * Handle subscription deleted (canceled)
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true },
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscription.id);
      return;
    }

    // Downgrade user to FREE plan
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'CANCELED',
          plan: 'FREE',
        },
      }),
      this.prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { plan: 'FREE' },
      }),
    ]);

    console.log(`✅ Subscription canceled: ${subscription.id} → Downgraded to FREE`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      return; // Not a subscription invoice
    }

    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Update subscription status to ACTIVE
    await this.prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'ACTIVE' },
    });

    console.log(`✅ Payment succeeded for subscription: ${subscriptionId}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      return;
    }

    const dbSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!dbSubscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Update subscription status to PAST_DUE
    await this.prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'PAST_DUE' },
    });

    console.log(`⚠️  Payment failed for subscription: ${subscriptionId}`);
  }

  /**
   * Map Stripe subscription status to our enum
   */
  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      incomplete: 'PAST_DUE',
      incomplete_expired: 'CANCELED',
      trialing: 'TRIALING',
      unpaid: 'PAST_DUE',
      paused: 'CANCELED',
    };

    return statusMap[stripeStatus] || 'CANCELED';
  }

  /**
   * Get plan from Stripe subscription items
   */
  private getPlanFromSubscription(subscription: Stripe.Subscription): Plan {
    const priceId = subscription.items.data[0]?.price.id;

    if (!priceId) {
      return 'FREE';
    }

    // Map price IDs to plans
    if (priceId === process.env.STRIPE_PRICE_PRO) {
      return 'PRO';
    }
    if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
      return 'ENTERPRISE';
    }

    return 'FREE';
  }

  /**
   * Get subscription details for user
   */
  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end in Stripe
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update our database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    // Reactivate in Stripe
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update our database
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        status: 'ACTIVE',
      },
    });
  }
}
