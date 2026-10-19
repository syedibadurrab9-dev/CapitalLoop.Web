export const environment = {
  production: false,
  get apiUrl(): string {
    return localStorage.getItem('cl_api_url') || 'https://cricket-queen-maintain-bennett.trycloudflare.com';
  }
};
