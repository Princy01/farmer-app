// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

function runtimeOverride(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.localStorage.getItem(key)?.trim() || fallback;
}

const defaultApiUrl = 'http://127.0.0.1:8082';
const defaultRealtimeUrl = 'http://127.0.0.1:8083';
const defaultPaymentGatewayUrl = 'http://127.0.0.1:8081';

export const environment = {
  production: false,
  apiUrl: runtimeOverride('apiUrl', defaultApiUrl),
  realtimeApiUrl: runtimeOverride('realtimeApiUrl', runtimeOverride('transportRealtimeUrl', defaultRealtimeUrl)),
  transportRealtimeUrl: runtimeOverride('transportRealtimeUrl', runtimeOverride('realtimeApiUrl', defaultRealtimeUrl)),
  paymentMode: runtimeOverride('paymentMode', 'simulated'),
  paymentGatewayUrl: runtimeOverride('paymentGatewayUrl', defaultPaymentGatewayUrl),
  translateApiUrl: runtimeOverride('translateApiUrl', 'http://127.0.0.1:8000'),
  supportEmail: 'support@farmerapp.com',
  supportPhone: '+91-1234-567-890',
  privacyPolicyUrl: 'https://farmerapp.com/privacy-policy',
  termsOfServiceUrl: 'https://farmerapp.com/terms-of-service'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
