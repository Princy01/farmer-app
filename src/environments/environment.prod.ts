const appOrigin = 'https://melato.net.in';
const defaultApiUrl = 'https://api.melato.net.in';
const defaultRealtimeUrl = 'https://transport.melato.net.in';
const defaultTranslateUrl = 'https://api.melato.net.in/translate';
const defaultPaymentGatewayUrl = appOrigin;

export const environment = {
  production: true,
  apiUrl: defaultApiUrl,
  realtimeApiUrl: defaultRealtimeUrl,
  transportRealtimeUrl: defaultRealtimeUrl,
  paymentMode: 'gateway',
  paymentGatewayUrl: defaultPaymentGatewayUrl,
  translateApiUrl: defaultTranslateUrl,
  supportEmail: 'support@farmerapp.com',
  supportPhone: '+91-1234-567-890',
  privacyPolicyUrl: 'https://farmerapp.com/privacy-policy',
  termsOfServiceUrl: 'https://farmerapp.com/terms-of-service'
};
