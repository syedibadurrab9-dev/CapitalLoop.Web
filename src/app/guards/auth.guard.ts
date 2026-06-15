import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SubscriptionTier } from '../models/subscription-tier.model';

/**
 * Centrally manages route clearance authorization for the 5-tier ecosystem.
 * Dynamically evaluates permissions using route custom data configurations.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Allow the routing frame to process smoothly during the background OIDC code-exchange handshake
  if (authService.isExchangingCode()) {
    return true;
  }

  const isLoggedIn = authService.isLoggedIn();
  const currentTier = authService.userTier();

  // 2. Extract specific authorized tiers requested by the route configuration [app.routes.ts]
  // Fallback to general administrative roles if no custom tracking array is explicitly mapped
  const requiredTiers: string[] = route.data['expectedTiers'] || [
    'agent', 
    'agent-backoffice', 
    'advisor-wealth', 
    'tax-consultant-tier'
  ];

  // 3. Validation Logic Matrix
  if (isLoggedIn && currentTier && requiredTiers.includes(currentTier.toLowerCase())) {
    return true;
  }

  // 4. Security Isolation: Handle authenticated users attempting to trespass cross-domain workspaces
  if (isLoggedIn && currentTier && !requiredTiers.includes(currentTier.toLowerCase())) {
    console.warn(`[ROUTER_GUARD_CLEARANCE_DENIED]: Insufficient privileges for pathway: "${state.url}" | Session Tier: "${currentTier}"`);
    
    // Divert user to the local unauthorized fallback layout page safely
    router.navigate(['/unauthorized']);
    return false;
  }

  // 5. Breach Isolation: Unauthenticated context dropped instantly
  console.warn(`[ROUTER_GUARD_BLOCKED]: Intercepted unauthenticated connection attempt targeting: "${state.url}"`);
  router.navigate(['/login']);
  return false;
};