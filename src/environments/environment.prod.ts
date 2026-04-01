function runtimeOverride(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.localStorage.getItem(key)?.trim() || fallback;
}

const defaultApiUrl = 'http://160.250.204.132:3000';
const defaultRealtimeUrl = 'http://160.250.204.132:8083';
const defaultTranslateUrl = 'http://160.250.204.132:8000';

export const environment = {
  production: true,
  apiUrl: runtimeOverride('apiUrl', defaultApiUrl),
  realtimeApiUrl: runtimeOverride('realtimeApiUrl', runtimeOverride('transportRealtimeUrl', defaultRealtimeUrl)),
  transportRealtimeUrl: runtimeOverride('transportRealtimeUrl', runtimeOverride('realtimeApiUrl', defaultRealtimeUrl)),
  paymentMode: runtimeOverride('paymentMode', 'simulated'),
  paymentGatewayUrl: runtimeOverride('paymentGatewayUrl', runtimeOverride('apiUrl', defaultApiUrl)),
  translateApiUrl: runtimeOverride('translateApiUrl', defaultTranslateUrl),
  supportEmail: 'support@farmerapp.com',
  supportPhone: '+91-1234-567-890',
  privacyPolicyUrl: 'https://farmerapp.com/privacy-policy',
  termsOfServiceUrl: 'https://farmerapp.com/terms-of-service'
};
