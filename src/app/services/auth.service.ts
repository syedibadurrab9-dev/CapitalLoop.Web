import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // 🚀 FIXED: Swapped import path to include /http module
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../auth.config';
import { SubscriptionTier } from '../models/subscription-tier.model';

export interface AdminUserSessionProfile {
  name: string;
  email: string;
  tier: SubscriptionTier;
  isPremiumUser: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  public readonly appToken = signal<string | null>(localStorage.getItem('cl_app_token'));
  public readonly userTier = signal<string | null>(localStorage.getItem('cl_user_tier'));
  public readonly isExchangingCode = signal<boolean>(false);

  // ==============================================================================
  // REAL-TIME SUBNET ROUTING UTILITIES
  // ==============================================================================
  private readonly officeBaseUrl = 'http://10.20.0.97:5156';
  private readonly homeBaseUrl = 'http://192.168.0.100:5156';

  public getApiBaseUrl(): string {
    const currentHost = window.location.hostname;
    return (currentHost.startsWith('10.20.') || currentHost === 'office-admin.internal') 
      ? this.homeBaseUrl
      : this.officeBaseUrl;
  }

  public getNetworkProfileLabel(): string {
    const currentHost = window.location.hostname;
    return (currentHost.startsWith('10.20.') || currentHost === 'office-admin.internal')
      ? 'Office LAN Node (10.20.0.97)'
      : 'Home Network Cluster (192.168.0.100)';
  }

  // ==============================================================================
  // CRITICAL SECURITY GATING SIGNALS
  // ==============================================================================
  public readonly isLoggedIn = computed<boolean>(() => {
    const token = this.appToken();
    const tier = this.userTier();
    
    if (!token || !tier) return false;

    const administrativeTiers: string[] = [
      'agent', 
      'agent-backoffice', 
      'advisor-wealth', 
      'tax-consultant-tier'
    ];

    return administrativeTiers.includes(tier.toLowerCase());
  });

  public readonly currentUserProfile = computed<AdminUserSessionProfile | null>(() => {
    const token = this.appToken();
    const fallbackTier = (this.userTier() || 'standard-free') as SubscriptionTier;
    if (!token) return null;

    try {
      let base64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64Payload.length % 4) {
        base64Payload += '=';
      }
      
      const parsedClaims = JSON.parse(atob(base64Payload));
      
      const resolvedName = parsedClaims.unique_name || 
                           parsedClaims.name || 
                           parsedClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                           'System Administrator';

      const resolvedEmail = parsedClaims.email || 
                            parsedClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
                            '';

      const resolvedTier = (parsedClaims.tier || parsedClaims.SubscriptionTier || fallbackTier).toLowerCase() as SubscriptionTier;

      return {
        name: resolvedName,
        email: resolvedEmail,
        tier: resolvedTier,
        isPremiumUser: true 
      };
    } catch (err) {
      console.error('[JWT_PARSING_ERROR]: Failed decoding authorization token claims stream.', err);
      return { 
        name: 'System Administrator', 
        email: '', 
        tier: fallbackTier,
        isPremiumUser: true 
      };
    }
  });

  constructor() {
    this.oauthService.configure(authConfig);
  }

  public initializeSessionHandshake(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.oauthService.loadDiscoveryDocument()
        .then(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const authCode = urlParams.get('code');

          if (authCode) {
            this.isExchangingCode.set(true);
            this.exchangeAuthCodeWithBackend(authCode);
          }
          resolve();
        })
        .catch((err) => {
          console.error('[AUTH_INIT_DISCOVERY_FAULT]: Failed to connect to OIDC issuer.', err);
          resolve(); 
        });
    });
  }

  public getAccessToken(): string | null {
    return this.appToken();
  }

  public get currentUserValue(): AdminUserSessionProfile | null {
    return this.currentUserProfile();
  }

  private exchangeAuthCodeWithBackend(code: string): void {
    window.history.replaceState({}, document.title, window.location.pathname);

    const codeVerifier = sessionStorage.getItem('PKCE_verifier') || '';
    const payload = { token: code, codeVerifier: codeVerifier };
    const targetUrl = `${this.getApiBaseUrl()}/api/v1/auth/google-sso`;

    // 🚀 FIXED: Added explicit interface type shape and parameter typing rules below
    this.http.post<{ accessToken: string; subscriptionTier: string }>(targetUrl, payload).subscribe({
      next: (res: { accessToken: string; subscriptionTier: string }) => {
        const token = res.accessToken; 
        const tier = (res.subscriptionTier || '').toLowerCase();

        console.log('Backend Response Mapping:', { token, tier }); 

        localStorage.setItem('cl_app_token', token);
        localStorage.setItem('cl_user_tier', tier);

        this.appToken.set(token);
        this.userTier.set(tier);
        
        this.isExchangingCode.set(false);

        if (tier === 'agent' || tier === 'agent-backoffice') {
          this.router.navigate(['/dashboard']);
        } else if (tier === 'advisor-wealth') {
          this.router.navigate(['/risk-engine']);
        } else if (tier === 'tax-consultant-tier') {
          this.router.navigate(['/compliance/kyc-ledger']);
        } else {
          console.warn('⚠️ Gating Failure: Unauthorized Customer Account Tier Redirection:', tier);
          this.logout();
        }
      },
      error: (err: any) => {
        console.error('[BACKEND_EXCHANGE_FAULT]:', err);
        this.isExchangingCode.set(false);
        this.logout();
      }
    });
  }

  public async login(): Promise<void> {
    await this.oauthService.loadDiscoveryDocument();
    
    if (!this.oauthService.issuer) {
      console.error('⚠️ OIDC Discovery Failed: Issuer endpoint not reachable.');
      return;
    }

    this.oauthService.initCodeFlow();
  }

  public logout(): void {
    try {
      this.oauthService.logOut();
    } catch {
      // Graceful fallback
    }
    
    localStorage.removeItem('cl_app_token');
    localStorage.removeItem('cl_user_tier');
    this.appToken.set(null);
    this.userTier.set(null);
    sessionStorage.clear();
    
    if (window.location.search.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    this.router.navigate(['/login']);
  }
}