import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach internal authorization headers to external authentication providers (e.g. Google OIDC discovery)
  if (req.url.startsWith('https://accounts.google.com') || req.url.startsWith('https://oauth2.googleapis.com')) {
    return next(req);
  }

  // Extract administrative system JWT directly from storage
  const token = localStorage.getItem('cl_app_token');

  // If a valid administrative token exists, attach Bearer header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};