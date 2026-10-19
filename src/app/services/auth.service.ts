import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../auth.config';

export interface AdminUserSessionProfile {
  name: string;
  email: string;
  isPremiumUser: boolean;
  role?: string;
  licenseNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  // Exposing application level atomic session signals
  public readonly appToken = signal<string | null>(localStorage.getItem('cl_app_token'));
  public readonly userTier = signal<string | null>(localStorage.getItem('cl_user_tier'));
  public readonly operatorRole = signal<string | null>(localStorage.getItem('cl_operator_role'));
  public readonly operatorLicense = signal<string | null>(localStorage.getItem('cl_operator_license'));
  
  // Tracking signals for clearance and state
  public readonly clearanceDenied = signal<{ email: string; reason: string } | null>(null);
  public readonly isExchangingCode = signal<boolean>(false);

  // ==============================================================================
  // ✅ CRITICAL SECURITY GATING SIGNALS
  // ==============================================================================
  
  /**
   * Strictly evaluates logged-in parameters reactively based on a verified state.
   * Does NOT treat temporary URL parameters as a valid authenticated session.
   */
  public readonly isLoggedIn = computed<boolean>(() => {
    return this.appToken() !== null && this.userTier() === 'agent';
  });

  /**
   * Decodes claims and streams user session metadata parameters dynamically.
   */
  public readonly currentUserProfile = computed<AdminUserSessionProfile | null>(() => {
    const token = this.appToken();
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const parsedClaims = JSON.parse(atob(payloadBase64));
      
      return {
        name: parsedClaims.name || parsedClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'System Administrator',
        email: parsedClaims.email || parsedClaims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
        isPremiumUser: true,
        role: parsedClaims.role || parsedClaims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || this.operatorRole() || 'SuperAdmin',
        licenseNumber: parsedClaims.license || this.operatorLicense() || 'SECP-ADV-8492'
      };
    } catch {
      return {
        name: 'System Administrator',
        email: '',
        isPremiumUser: true,
        role: this.operatorRole() || 'SuperAdmin',
        licenseNumber: this.operatorLicense() || 'SECP-ADV-8492'
      };
    }
  });

  constructor() {
    this.oauthService.configure(authConfig);
    
    // Check if we have incoming URL parameters from a Google redirect window
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
      this.isExchangingCode.set(true);
      this.exchangeAuthCodeWithBackend(authCode);
    } else {
      this.oauthService.loadDiscoveryDocumentAndTryLogin();
    }
  }

  public getAccessToken(): string | null {
    return this.appToken();
  }

  public get currentUserValue(): AdminUserSessionProfile | null {
    return this.currentUserProfile();
  }

  public clearClearanceError(): void {
    this.clearanceDenied.set(null);
  }

  private exchangeAuthCodeWithBackend(code: string): void {
    let codeVerifier = sessionStorage.getItem('PKCE_verifier');

    if (!codeVerifier) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.endsWith('_PKCE_verifier')) {
          codeVerifier = sessionStorage.getItem(key);
          break;
        }
      }
    }

    const payload = {
      token: code,
      codeVerifier: codeVerifier || ''
    };

    this.http.post<any>('http://localhost:5156/api/auth/google-sso', payload)
      .subscribe({
        next: (res) => {
          // Clear URL query parameters to keep the browser address bar clean
          window.history.replaceState({}, document.title, window.location.pathname);
          this.isExchangingCode.set(false);

          if (res.tier === 'agent') {
            localStorage.setItem('cl_app_token', res.token);
            localStorage.setItem('cl_user_tier', res.tier);
            if (res.role) localStorage.setItem('cl_operator_role', res.role);
            if (res.licenseNumber) localStorage.setItem('cl_operator_license', res.licenseNumber);

            this.appToken.set(res.token);
            this.userTier.set(res.tier);
            this.operatorRole.set(res.role || 'SuperAdmin');
            this.operatorLicense.set(res.licenseNumber || 'SECP-ADV-8492');
            this.clearanceDenied.set(null);

            this.router.navigate(['/dashboard']);
          } else {
            console.warn('⚠️ Gating Failure: Accessed via non-agent parameters.');
            localStorage.removeItem('cl_app_token');
            localStorage.removeItem('cl_user_tier');
            this.appToken.set(null);
            this.userTier.set(null);
            this.clearanceDenied.set({
              email: res.email || 'Current Google Account',
              reason: 'This account authenticated successfully with Google, but is not provisioned with administrative operator clearance in Capital Loop.'
            });
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          console.error('[BACKEND_EXCHANGE_FAULT] API is unreachable or token invalid.', err);
          this.isExchangingCode.set(false);
          this.clearanceDenied.set({
            email: 'Authentication Service',
            reason: 'Google identity exchange handshake failed with backend server.'
          });
          this.logout();
        }
      });
  }

  public login(): void {
    this.clearanceDenied.set(null);
    this.oauthService.initCodeFlow();
  }

  public logout(): void {
    this.oauthService.logOut();
    localStorage.removeItem('cl_app_token');
    localStorage.removeItem('cl_user_tier');
    localStorage.removeItem('cl_operator_role');
    localStorage.removeItem('cl_operator_license');
    this.appToken.set(null);
    this.userTier.set(null);
    this.operatorRole.set(null);
    this.operatorLicense.set(null);
    this.clearanceDenied.set(null);
    sessionStorage.clear();
    
    // Clear dynamic address bar codes to prevent looping conditions if kicked out mid-flight
    if (window.location.search.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    this.router.navigate(['/login']);
  }
}