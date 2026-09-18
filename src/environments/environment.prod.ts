function runtimeOverride(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.localStorage.getItem(key)?.trim();
  if (!value) {
    return fallback;
  }

  if (isRuntimeEndpointKey(key) && !isProductionUrl(value)) {
    return fallback;
  }

  return value;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isProductionUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !isLoopbackHost(url.hostname) && url.hostname !== '10.0.2.2';
  } catch {
    return false;
  }
}

function isRuntimeEndpointKey(key: string): boolean {
  return [
    'apiUrl',
    'realtimeApiUrl',
    'transportRealtimeUrl',
    'paymentGatewayUrl',
    'translateApiUrl'
  ].includes(key);
}

const appOrigin = 'https://melato.net.in';
const defaultApiUrl = 'https://api.melato.net.in';
const defaultRealtimeUrl = 'https://transport.melato.net.in';
const defaultTranslateUrl = 'https://api.melato.net.in/translate';
const defaultPaymentGatewayUrl = appOrigin;

export const environment = {
  production: true,
  apiUrl: runtimeOverride('apiUrl', defaultApiUrl),
  realtimeApiUrl: runtimeOverride('realtimeApiUrl', runtimeOverride('transportRealtimeUrl', defaultRealtimeUrl)),
  transportRealtimeUrl: runtimeOverride('transportRealtimeUrl', runtimeOverride('realtimeApiUrl', defaultRealtimeUrl)),
  paymentMode: 'gateway',
  paymentGatewayUrl: runtimeOverride('paymentGatewayUrl', defaultPaymentGatewayUrl),
  translateApiUrl: runtimeOverride('translateApiUrl', defaultTranslateUrl),
  supportEmail: 'support@farmerapp.com',
  supportPhone: '+91-1234-567-890',
  privacyPolicyUrl: 'https://farmerapp.com/privacy-policy',
  termsOfServiceUrl: 'https://farmerapp.com/terms-of-service'
};
