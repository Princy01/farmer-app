// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

function browserHost(): string {
  if (typeof window === 'undefined') {
    return '127.0.0.1';
  }
  return window.location.hostname || '127.0.0.1';
}

function runtimeOverride(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.localStorage.getItem(key)?.trim() || fallback;
}

const host = browserHost();

export const environment = {
  production: false,
  apiUrl: runtimeOverride('apiUrl', `http://${host}:8080`),
  transportRealtimeUrl: runtimeOverride('transportRealtimeUrl', `http://${host}:8088`),
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
