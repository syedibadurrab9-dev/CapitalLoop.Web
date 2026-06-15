/**
 * Strict type union defining the definitive 5-tier product ecosystem.
 * Aligns perfectly with CapitalLoop relational identity tables.
 */
export type SubscriptionTier = 
  | 'standard-free' 
  | 'premium-monthly' 
  | 'agent-backoffice' 
  | 'advisor-wealth' 
  | 'tax-consultant-tier';

/**
 * Immutable system constants mapping to database classification entries.
 */
export const SUBSCRIPTION_TIERS = {
  STANDARD_FREE: 'standard-free' as SubscriptionTier,
  PREMIUM_MONTHLY: 'premium-monthly' as SubscriptionTier,
  AGENT_BACKOFFICE: 'agent-backoffice' as SubscriptionTier,
  ADVISOR_WEALTH: 'advisor-wealth' as SubscriptionTier,
  TAX_CONSULTANT_TIER: 'tax-consultant-tier' as SubscriptionTier
} as const;

/**
 * Strongly typed interface structure modeling authenticated specialist profiles.
 */
export interface UserSessionProfile {
  id: string;
  email: string;
  displayName: string;
  tier: SubscriptionTier;
  isFiler: boolean;
  age?: number;
  cnic?: string;
}