import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpContext,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError, timeout } from 'rxjs';
import { SKIP_TRANSLATION } from './translation.context';

// HTTP Timeout: 30 seconds
const HTTP_TIMEOUT_MS = 30000;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register-user') ||
    req.url.includes('/auth/refresh-token') ||
    req.url.includes('/auth/');

  const isMasterDataEndpoint =
    req.url.includes('/getStates') ||
    req.url.includes('/getAllCities') ||
    req.url.includes('/getAllCitiesOfState') ||
    req.url.includes('/getLocations') ||
    req.url.includes('/getLocationsByCity') ||
    req.url.includes('/getAllLanguages') ||
    req.url.includes('/setUserLanguagePreference') ||
    req.url.includes('/getUserLanguagePreference');

  const shouldSkipTranslation = isAuthEndpoint || isMasterDataEndpoint;

  let modifiedReq = req;
  const preferredLanguage = getPreferredLanguage();

  modifiedReq = modifiedReq.clone({
    setHeaders: {
      'X-App-Language': preferredLanguage,
    },
  });

  const token = authService.getToken();
  if (token && !isAuthEndpoint) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Automatically attach context to skip translation
  if (shouldSkipTranslation) {
    modifiedReq = modifiedReq.clone({
      context: (modifiedReq.context || new HttpContext()).set(SKIP_TRANSLATION, true),
    });
  }

  return next(modifiedReq).pipe(
    timeout(HTTP_TIMEOUT_MS),
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 401:
            return handleUnauthorizedError(modifiedReq, next, authService);
          case 403:
            authService.logout();
            return throwError(() => ({
              ...error,
              userMessage: 'HTTP_ERROR.FORBIDDEN'
            }));
          case 404:
            return throwError(() => ({
              ...error,
              userMessage: 'HTTP_ERROR.NOT_FOUND'
            }));
          case 500:
          case 502:
          case 503:
            return throwError(() => ({
              ...error,
              userMessage: 'HTTP_ERROR.SERVER_ERROR'
            }));
          case 0:
            // Network error
            return throwError(() => ({
              ...error,
              userMessage: 'HTTP_ERROR.NETWORK_ERROR'
            }));
        }
      }
      return throwError(() => error);
    })
  );
};

function getPreferredLanguage(): string {
  const rawLang = (
    localStorage.getItem('preferred_language') ||
    localStorage.getItem('appLang') ||
    'en'
  ).toLowerCase();
  const baseLang = rawLang.split('-')[0];
  const supportedLangs = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'or', 'mr', 'gu', 'bn', 'pa', 'ur'];

  return supportedLangs.includes(baseLang) ? baseLang : 'en';
}

// Helper: Add token
function addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Handle token refresh
function handleUnauthorizedError(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  return authService.refreshToken().pipe(
    switchMap((response) => {
      const newToken = response.access_token;
      const reqWithNewToken = addTokenToRequest(request, newToken);

      // Preserve the SKIP_TRANSLATION context during retry
      const finalReq = request.context.get(SKIP_TRANSLATION)
        ? reqWithNewToken.clone({
            context: new HttpContext().set(SKIP_TRANSLATION, true),
          })
        : reqWithNewToken;

      return next(finalReq);
    }),
    catchError((refreshError) => {
      authService.logout();
      return throwError(() => refreshError);
    })
  );
}
