import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { AuthService } from './services/auth.service';

/**
 * 🏭 App Initialization Factory
 * Decoupled from the injection context to ensure the DI container 
 * resolves the service instance explicitly via the 'deps' array.
 */
export function initializeAppFactory(authService: AuthService): () => Promise<void> {
  return () => authService.initializeSessionHandshake();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    provideRouter(routes, withComponentInputBinding()),
    
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    provideOAuthClient(),

    // =============================================================================
    // 🛡️ SYSTEM APP INITIALIZER GATEWAY
    // Explicitly defining 'deps' ensures AuthService is available before factory execution.
    // =============================================================================
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [AuthService],
      multi: true
    }
  ]
};