import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin + '/login',
  clientId: '451325656019-drjb9j6j2g8hcq99697c3dv2m4nhdbu0.apps.googleusercontent.com',
  scope: 'openid profile email',
  responseType: 'code', // Keep Code Flow enabled
  showDebugInformation: true,
  // 🚀 ADD THIS line to prevent the library from hitting oauth2.googleapis.com/token directly from the browser
  oidc: false 
};