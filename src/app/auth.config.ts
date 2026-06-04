import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin + '/login',
  clientId: '13131396392-40lscdfkt1896c3s52p7hbvs9gtg6vah.apps.googleusercontent.com',
  scope: 'openid profile email',
  responseType: 'code', // Keep Code Flow enabled
  showDebugInformation: true,
  // 🚀 ADD THIS line to prevent the library from hitting oauth2.googleapis.com/token directly from the browser
  oidc: false 
};