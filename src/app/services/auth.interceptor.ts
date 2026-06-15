import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 🛡️ SECURITY BYPASS GUARD: Immediately release external federated OAuth handshakes
  if (req.url.includes('google.com') || req.url.includes('googleapis.com')) {
    return next(req);
  }

  // 🧪 LAZY RESOLUTION: Inject the root container manager instead of the service directly
  const injector = inject(Injector);

  // Safely extract AuthService lazily at request-time, slicing the DI circular loop clean
  const authService = injector.get(AuthService);
  const token = authService.appToken();

  // If a valid administrative token footprint exists, inject it securely into the pipeline headers
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  // Pass the updated request safely down the downstream network handshake line
  return next(req);
};