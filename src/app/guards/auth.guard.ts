import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * 1. Check if an active SSO token handshake is currently executing over the wire.
   * If true, we allow the routing frame to hold its position and process the background HTTP request 
   * rather than prematurely dropping the user back to the login page.
   */
  if (authService.isExchangingCode()) {
    return true;
  }

  /**
   * 2. Strict Identity Verification Check.
   * Validates that a genuine, verified client app token and matching 'agent' operational 
   * tier classification footprint are actually present in state.
   */
  if (authService.isLoggedIn()) {
    return true;
  }

  // 3. Security Breach Isolation: Block passage and force fallback to gated sign-in portal
  console.warn(`[ROUTER_GUARD_BLOCKED] Unauthenticated connection intercepted matching endpoint path: ${state.url}`);
  router.navigate(['/login']);
  return false;
};