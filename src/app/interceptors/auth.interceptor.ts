import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  // Skip adding token for auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register-user') || req.url.includes('/auth/refresh-token')) {
    return next(req);
  }

  // Add token to the request if available
  const token = authService.getToken();
  if (token) {
    req = addTokenToRequest(req, token);
  }

  // Handle the request and catch any errors
  return next(req).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized errors
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handleUnauthorizedError(req, next, authService);
      }

      // Re-throw other errors
      return throwError(() => error);
    })
  );
};

// Helper function to add token to request
function addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

// Helper function to handle 401 errors by refreshing the token
function handleUnauthorizedError(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  return authService.refreshToken().pipe(
    switchMap(response => {
      // After successful refresh, retry the request with new token
      return next(addTokenToRequest(request, response.access_token));
    }),
    catchError(refreshError => {
      // If refresh fails, log the user out
      authService.logout();
      return throwError(() => refreshError);
    })
  );
}