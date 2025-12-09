import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpContext,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { SKIP_TRANSLATION } from './translation.context';

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

  const shouldSkipTranslation = isAuthEndpoint    // || !!authService.getToken();

  let modifiedReq = req;

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
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handleUnauthorizedError(modifiedReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

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