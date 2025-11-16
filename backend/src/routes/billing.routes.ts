/**
 * Billing Routes - Stripe subscription management
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, Plan } from '@prisma/client';
import Stripe from 'stripe';
import { BillingService } from '../services/billing.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/errors';

const router = Router();
import { prisma } from '../lib/prisma.js';

const billingService = new BillingService(prisma);

/**
 * POST /billing/checkout
 * Create Stripe checkout session for plan upgrade
 */
router.post(
  '/checkout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { plan } = req.body;

    if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan. Must be PRO or ENTERPRISE',
      });
    }

    // Create checkout session
    const checkoutUrl = await billingService.createCheckoutSession({
      userId,
      plan: plan as Plan,
      successUrl: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.FRONTEND_URL}/billing/canceled`,
    });

    res.json({
      success: true,
      data: {
        url: checkoutUrl,
      },
    });
  })
);

/**
 * POST /billing/portal
 * Create customer portal session for subscription management
 */
router.post(
  '/portal',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const portalUrl = await billingService.createPortalSession({
      userId,
      returnUrl: `${process.env.FRONTEND_URL}/settings/billing`,
    });

    res.json({
      success: true,
      data: {
        url: portalUrl,
      },
    });
  })
);

/**
 * GET /billing/subscription
 * Get current subscription details
 */
router.get(
  '/subscription',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        plan: user.plan,
        subscription: user.subscription || null,
      },
    });
  })
);

/**
 * POST /billing/cancel
 * Cancel subscription at period end
 */
router.post(
  '/cancel',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await billingService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    });
  })
);

/**
 * POST /billing/reactivate
 * Reactivate a canceled subscription
 */
router.post(
  '/reactivate',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await billingService.reactivateSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  })
);

/**
 * POST /billing/webhook
 * Handle Stripe webhook events (PUBLIC - no auth required)
 */
router.post(
  '/webhook',
  // Use raw body for Stripe signature verification
  asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured',
      });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia',
      });

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid signature',
      });
    }

    // Handle the event
    try {
      await billingService.handleWebhook(event);

      res.json({
        success: true,
        received: true,
      });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  })
);

/**
 * GET /billing/plans
 * Get available plans and pricing (PUBLIC)
 */
router.get('/plans', (req: Request, res: Response) => {
  const plans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        '10,000 AI tokens/month',
        'Basic security analysis',
        'HTTP/HTTPS interception',
        'Request history (7 days)',
        'Community support',
      ],
      limits: {
        aiTokens: 10000,
        requestHistory: 7,
        projects: 3,
      },
    },
    {
      id: 'PRO',
      name: 'Professional',
      price: 29,
      currency: 'USD',
      interval: 'month',
      features: [
        '200,000 AI tokens/month',
        'Advanced AI analysis (3 modes)',
        'Unlimited projects',
        'Request history (90 days)',
        'Export reports (PDF, JSON, CSV)',
        'Priority support',
        'Chrome extension',
      ],
      limits: {
        aiTokens: 200000,
        requestHistory: 90,
        projects: -1, // unlimited
      },
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 99,
      currency: 'USD',
      interval: 'month',
      features: [
        '1,000,000 AI tokens/month',
        'All PRO features',
        'Team collaboration',
        'Custom AI training',
        'SSO integration',
        'Advanced compliance reports',
        'Dedicated support',
        'Custom integrations',
      ],
      limits: {
        aiTokens: 1000000,
        requestHistory: 365,
        projects: -1,
        teamMembers: 10,
      },
    },
  ];

  res.json({
    success: true,
    data: plans,
  });
});

export default router;
