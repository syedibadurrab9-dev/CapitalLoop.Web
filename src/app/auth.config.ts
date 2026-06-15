import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin + '/login',
  clientId: '13131396392-40lscdfkt1896c3s52p7hbvs9gtg6vah.apps.googleusercontent.com',
  scope: 'openid profile email',
  responseType: 'code',
  showDebugInformation: true,
  
  // 🛡️ SECURITY BYPASS:
  // Disabling OIDC prevents the library from treating this as a full OIDC flow 
  // and trying to validate tokens locally.
  oidc: false,

  // 🚀 HARD KILL:
  // By nullifying these endpoints, any automated logic inside the library that 
  // attempts to reach out to Google's token service will hit these dummy values 
  // instead of triggering a network-level 400 error.
  tokenEndpoint: 'about:blank',
  userinfoEndpoint: 'about:blank'
};


// import { AuthConfig } from 'angular-oauth2-oidc';
// import { environment } from '../environments/environment';

// // export const authConfig: AuthConfig = {
// //   // 🏛️ Federated Identity Endpoint Authority
// //   issuer: 'https://accounts.google.com',
// //   strictDiscoveryDocumentValidation: false,

// //   // =============================================================================
// //   // 🌍 FIXED: Appended context path to match active AuthService listener routes
// //   // =============================================================================
// //   redirectUri: window.location.origin + '/login',

// //   // 🔒 SYNCED: Pulls your updated Angular Admin client credential from environment
// //   clientId: environment.googleWebClientId,
  
// //   scope: 'openid profile email',
  
// //   // ⚡ Secure Authorization Code Flow with PKCE (Proof Key for Code Exchange)
// //   responseType: 'code', 
  
// //   showDebugInformation: !environment.production, 
  
// //   // 🚀 Setting this to false allows our custom .NET proxy to handle tokens, preventing browser CORS jams
// //   oidc: false 
// // };


// export const authConfig: AuthConfig = {
//   issuer: 'https://accounts.google.com',
//   strictDiscoveryDocumentValidation: false,
//   redirectUri: window.location.origin + '/login',
//   clientId: environment.googleWebClientId,
//   scope: 'openid profile email',
//   responseType: 'code',
//   oidc: false, // Keep this false for your .NET proxy
//   showDebugInformation: true,
//   // Add this to ensure the library doesn't try to validate JWTs locally:
//   skipIssuerCheck: true 
// };