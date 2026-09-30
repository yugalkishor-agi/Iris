// Payment Service for React Native (Stripe Integration)
// Docs: https://stripe.com/docs/mobile/react-native

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wallet';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      city?: string;
      country?: string;
      postal_code?: string;
    };
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  client_secret: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'premium' | 'boost' | 'gift' | 'tip';
  features: string[];
}

class PaymentService {
  private publishableKey: string;
  private isInitialized: boolean = false;

  constructor() {
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key';
  }

  /**
   * Initialize Stripe
   */
  async initialize(): Promise<void> {
    try {
      // In a real implementation, you would initialize Stripe here
      // const { initStripe } = require('@stripe/stripe-react-native');
      // await initStripe({ publishableKey: this.publishableKey });
      
      this.isInitialized = true;
      console.log('✅ Payment service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize payment service:', error);
    }
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<Product[]> {
    try {
      // In production, fetch from your backend
      return [
        {
          id: 'premium_monthly',
          name: 'Iris Premium',
          description: 'Unlock premium features and remove ads',
          price: 999, // $9.99 in cents
          currency: 'usd',
          type: 'premium',
          features: [
            'Ad-free experience',
            'Advanced analytics',
            'Priority support',
            'Exclusive filters',
            'Unlimited story highlights',
          ],
        },
        {
          id: 'boost_post',
          name: 'Boost Post',
          description: 'Increase your post visibility',
          price: 299, // $2.99
          currency: 'usd',
          type: 'boost',
          features: [
            'Reach more people',
            '24-hour boost',
            'Analytics included',
          ],
        },
        {
          id: 'super_like',
          name: 'Super Like',
          description: 'Stand out with a super like',
          price: 99, // $0.99
          currency: 'usd',
          type: 'gift',
          features: [
            'Special notification',
            'Priority in feed',
            'Unique animation',
          ],
        },
      ];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent | null> {
    try {
      // In production, call your backend to create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata,
        }),
      });

      const paymentIntent = await response.json();
      return paymentIntent;
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return null;
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, use Stripe SDK to confirm payment
      // const { confirmPayment } = require('@stripe/stripe-react-native');
      // const result = await confirmPayment(paymentIntentId, { paymentMethodId });
      
      // Mock successful payment for demo
      return { success: true };
    } catch (error) {
      console.error('Failed to process payment:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Subscribe to premium
   */
  async subscribeToPremium(paymentMethodId: string): Promise<Subscription | null> {
    try {
      // In production, call your backend to create subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: paymentMethodId,
          price_id: 'price_premium_monthly',
        }),
      });

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to premium:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/cancel-subscription/${subscriptionId}`, {
        method: 'POST',
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(`/api/subscription-status/${userId}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return null;
    }
  }

  /**
   * Send tip to creator
   */
  async sendTip(
    creatorId: string,
    amount: number,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentIntent = await this.createPaymentIntent(amount, 'usd', {
        type: 'tip',
        creator_id: creatorId,
        message: message || '',
      });

      if (!paymentIntent) {
        return { success: false, error: 'Failed to create payment intent' };
      }

      // In production, you would show payment sheet here
      // For demo, assume successful payment
      return { success: true };
    } catch (error) {
      console.error('Failed to send tip:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Boost post
   */
  async boostPost(
    postId: string,
    duration: number = 24,
    budget: number = 299
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentIntent = await this.createPaymentIntent(budget, 'usd', {
        type: 'boost',
        post_id: postId,
        duration: duration.toString(),
      });

      if (!paymentIntent) {
        return { success: false, error: 'Failed to create payment intent' };
      }

      // Process payment and start boost
      return { success: true };
    } catch (error) {
      console.error('Failed to boost post:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Purchase super like
   */
  async purchaseSuperLike(targetUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const paymentIntent = await this.createPaymentIntent(99, 'usd', {
        type: 'super_like',
        target_user_id: targetUserId,
      });

      if (!paymentIntent) {
        return { success: false, error: 'Failed to create payment intent' };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to purchase super like:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/payment-history/${userId}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number, currency: string = 'usd'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    
    return formatter.format(amount / 100); // Convert cents to dollars
  }

  /**
   * Check if user has premium
   */
  async hasPremium(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus(userId);
      return subscription?.status === 'active';
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Get premium features
   */
  getPremiumFeatures(): string[] {
    return [
      'Ad-free experience',
      'Advanced analytics and insights',
      'Priority customer support',
      'Exclusive filters and effects',
      'Unlimited story highlights',
      'Enhanced privacy controls',
      'Early access to new features',
      'Increased upload limits',
      'Custom profile themes',
      'Advanced search filters',
    ];
  }
}

// Singleton instance
export const paymentService = new PaymentService();

// Export convenience functions
export const initializePayments = () => paymentService.initialize();
export const getProducts = () => paymentService.getProducts();
export const subscribeToPremium = (paymentMethodId: string) => 
  paymentService.subscribeToPremium(paymentMethodId);
export const sendTip = (creatorId: string, amount: number, message?: string) => 
  paymentService.sendTip(creatorId, amount, message);
export const boostPost = (postId: string, duration?: number, budget?: number) => 
  paymentService.boostPost(postId, duration, budget);
export const hasPremium = (userId: string) => paymentService.hasPremium(userId);
