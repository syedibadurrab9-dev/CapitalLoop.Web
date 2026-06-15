export const environment = {
  production: false,
  
  // 🔄 MASTER NETWORK PROFILE TOGGLE SWITCH
  // Set to 1 for HOME LAN (192.168.0.100)
  // Set to 2 for OFFICE LAN (10.20.0.81)
  activeNetworkSwitch: 2,

  // =============================================================================
  // 🛡️ FIXED: Updated with your dedicated Angular Admin Portal Client ID
  // =============================================================================
  googleWebClientId: '13131396392-40lscdfkt1896c3s52p7hbvs9gtg6vah.apps.googleusercontent.com',
  appVersionTag: '1.0.0-beta.54',

  /**
   * 🚀 DYNAMIC REST GATEWAY MAPPER
   */
  get apiBaseUrl(): string {
    return this.activeNetworkSwitch === 1 
      ? 'http://192.168.0.100:5156/api/v1' 
      : 'http://10.20.0.97:5156/api/v1';
  },

  /**
   * 🔌 DYNAMIC SIGNALR HUB MAPPER
   */
  get signalrSupportHubUrl(): string {
    return this.activeNetworkSwitch === 1 
      ? 'http://192.168.0.100:5156/support-hub' 
      : 'http://10.20.0.97:5156/support-hub';
  }
};