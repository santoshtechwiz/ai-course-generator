// Centralized shared types for the project
// Move all shared types, interfaces, and type aliases here

// Example: export type QuizType = ...
// Example: export interface User { ... }

// Add more as you consolidate from the codebase

// Subscription and plan types
export type SubscriptionPlanType = "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE" | "PRO" | "ULTIMATE";
export type SubscriptionStatusType = "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "TRIAL" | "NONE";

export interface FeatureAvailability {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  available: boolean;
  comingSoon?: boolean;
}

export interface PlanLimits {
  maxQuestionsPerQuiz: number;
  maxCoursesPerMonth: number;
  apiCallsPerDay?: number;
}

export interface PriceOption {
  duration: number;
  price: number;
  currency: string;
  savings?: number;
}

export interface PaymentOptions {
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  description: string;
  icon: any;
  tokens: number;
  options: PriceOption[];
  limits: PlanLimits;
  features: FeatureAvailability[];
  popular?: boolean;
}

export interface SubscriptionData {
  credits?: number;
  tokensUsed?: number;
  isSubscribed: boolean;
  subscriptionPlan?: SubscriptionPlanType;
  currentPlan?: string | null;
  trialEndsAt?: string | null;
  expirationDate?: string;
  cancelAtPeriodEnd?: boolean;
  status?: SubscriptionStatusType | string;
  features?: string[];
}

export interface TokenUsage {
  used: number;
  total: number;
  percentage?: number;
  hasExceededLimit?: boolean;
  remaining?: number;
  resetDate?: string;
}

export interface TokenUsageResponse {
  used: number;
  total: number;
}

export interface SubscriptionDetails {
  id: string;
  customerId: string;
  priceId: string;
  quantity: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlanType;
  canceledAt?: string;
  endedAt?: string;
  trialStart?: string;
  trialEnd?: string;
  tokenUsage?: TokenUsage;
  paymentMethod?: any;
  invoices?: any[];
}

export interface PaymentGateway {
  createCheckoutSession(
    userId: string,
    planName: string,
    duration: number,
    options?: PaymentOptions,
  ): Promise<{ sessionId: string; url: string }>;
  cancelSubscription(userId: string): Promise<boolean>;
  resumeSubscription(userId: string): Promise<boolean>;
  verifyPaymentStatus(sessionId: string): Promise<{
    status: "succeeded" | "pending" | "failed" | "canceled";
    subscription?: any;
  }>;
}

export interface PromoValidationResult {
  valid: boolean;
  message?: string;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  code?: string;
  discountPercentage?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface AddOnPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}
