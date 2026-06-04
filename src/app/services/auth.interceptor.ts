import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Extract your administrative system JWT from your existing OAuth session context
  const token = authService.getAccessToken();

  // If a valid administrative token footprint exists, inject it securely into the pipeline headers
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Pass the updated request down the downstream network handshake line
  return next(req);
};