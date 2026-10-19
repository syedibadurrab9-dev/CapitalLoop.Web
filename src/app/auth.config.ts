import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin + '/login',
  clientId: '451325656019-drjb9j6j2g8hcq99697c3dv2m4nhdbu0.apps.googleusercontent.com',
  scope: 'openid profile email',
  responseType: 'code',
  showDebugInformation: true,
  customQueryParams: {
    prompt: 'select_account'
  },
  oidc: false
};