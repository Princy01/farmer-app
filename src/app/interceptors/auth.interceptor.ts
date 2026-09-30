import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpContext,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError, timeout } from 'rxjs';
import { SKIP_TRANSLATION } from './translation.context';

// HTTP Timeout: 30 seconds
const HTTP_TIMEOUT_MS = 30000;
const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

let refreshRequest$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

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
        const errorBody = error.error as any;
        if (error.status === 403 && errorBody?.error_code === 'payment_details_required') {
          const redirectTo = errorBody?.redirect_to || '/payment-details';
          if (!router.url.startsWith(redirectTo)) {
            router.navigate([redirectTo], {
              queryParams: { returnUrl: router.url }
            });
          }
          return throwError(() => ({
            ...error,
            userMessage: errorBody?.message || 'PAYMENT_DETAILS.MISSING_MESSAGE'
          }));
        }
        if (isAuthEndpoint) {
          return throwError(() => error);
        }
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
  if (request.context.get(AUTH_RETRIED)) {
    return throwError(() => new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    }));
  }

  if (!refreshRequest$) {
    refreshRequest$ = authService.refreshToken().pipe(
      switchMap((response) => {
        if (!response.access_token) {
          return throwError(() => new Error('Token refresh did not return an access token'));
        }
        return [response.access_token];
      }),
      finalize(() => {
        refreshRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  return refreshRequest$.pipe(
    switchMap((newToken) => {
      const retryContext = request.context.set(AUTH_RETRIED, true);
      const reqWithNewToken = addTokenToRequest(request, newToken).clone({
        context: retryContext,
      });
      return next(reqWithNewToken);
    }),
    catchError((refreshError) => {
      authService.logout();
      return throwError(() => refreshError);
    })
  );
}
