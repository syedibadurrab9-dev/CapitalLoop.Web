import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Optimizes event change cycles by coalescing nested interaction microtasks
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Binds our structural path routing matrix (including our new support-hub layout)
    provideRouter(routes),
    
    // ✅ Injects core HttpClient capabilities with the functional security interceptor pass-through
    provideHttpClient(
      withInterceptors([authInterceptor]) // Automatically appends administrative JWT signatures to backend pipelines
    )
  ]
};