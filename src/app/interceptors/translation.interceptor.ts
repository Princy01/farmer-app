import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Translation Interceptor
 *
 * Purpose:
 * - Sends API requests and responses through unchanged.
 * - Prevents accidental transmission of complete API response objects to a
 *   translation service.
 * - User-visible fields must be translated explicitly by a dedicated adapter.
 */
export const translationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  // API responses can contain identifiers, amounts, addresses, and other
  // structured data. Never send complete responses to a translation service.
  // User-visible text should be translated explicitly at the field level.
  return next(req);
};