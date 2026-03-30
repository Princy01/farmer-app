const runtimeOrigin =
  typeof window !== 'undefined' ? window.location.origin : 'https://app.example.com';

export const environment = {
  production: true,
  apiUrl: runtimeOrigin,
  transportRealtimeUrl: runtimeOrigin,
  translateApiUrl: runtimeOrigin,
  supportEmail: 'support@farmerapp.com',
  supportPhone: '+91-1234-567-890',
  privacyPolicyUrl: 'https://farmerapp.com/privacy-policy',
  termsOfServiceUrl: 'https://farmerapp.com/terms-of-service'
};
