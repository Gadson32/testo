import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

export const PLANS = {
  STARTER: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    features: ["Up to 50 customers", "1 technician", "Basic reporting"],
  },
  PROFESSIONAL: {
    name: "Professional",
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    features: [
      "Up to 500 customers",
      "5 technicians",
      "Advanced reporting",
      "SMS notifications",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    features: [
      "Unlimited customers",
      "Unlimited technicians",
      "Custom reporting",
      "Priority support",
      "API access",
    ],
  },
} as const;
