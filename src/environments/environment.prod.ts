function runtimeOverride(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.localStorage.getItem(key)?.trim();
  if (!value) {
    return fallback;
  }

  if (isLoopbackHost(window.location.hostname) && isRuntimeEndpointKey(key) && !isLoopbackUrl(value)) {
    return fallback;
  }

  return value;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLoopbackUrl(value: string): boolean {
  try {
    return isLoopbackHost(new URL(value).hostname);
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

function runtimeDefault(publicUrl: string, tunnelPort: number): string {
  if (typeof window === 'undefined') {
    return publicUrl;
  }

  const hostname = window.location.hostname;
  if (isLoopbackHost(hostname)) {
    return `http://${hostname}:${tunnelPort}`;
  }

  return publicUrl;
}

const defaultApiUrl = runtimeDefault('http://160.250.204.132:3000', 8082);
const defaultRealtimeUrl = runtimeDefault('http://160.250.204.132:8083', 8083);
const defaultTranslateUrl = runtimeDefault('http://160.250.204.132:8000', 8000);

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
