 import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { TranslateApiService } from '@/services/translate-api.service';
import { SKIP_TRANSLATION } from './translation.context';

/**
 * Translation Interceptor (Response-Only)
 *
 * Purpose:
 * - Sends original (English/raw) data to backend → safe & reliable
 * - Automatically translates API response into user's preferred language (e.g., Hindi)
 * - Skips translation if SKIP_TRANSLATION context is set
 * - Assumes preferredLanguage is already loaded after login (no extra HTTP call)
 */
export const translationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const translateService = inject(TranslateApiService);

  // Skip translation entirely if explicitly disabled via context
  // Stop from itself, env.translateApiUrl calls or contains: /assets/i18n

  if (req.url.startsWith(translateService.translateApiUrl) || req.url.includes('/assets/i18n')) {
    return next(req);
  }

  if (req.context.get(SKIP_TRANSLATION) === true) {
    return next(req);
  }

  // Forward request as-is → backend receives original data
  return next(req).pipe(
    switchMap((event: HttpEvent<any>): Observable<HttpEvent<any>> => {
      // We only care about successful HttpResponse events
      if (!(event instanceof HttpResponse)) {
        return of(event);
      }

      const body = event.body;

      // Skip if response has no body or body is not an object (e.g., string, number, null, blob)
      if (!body || typeof body !== 'object') {
        return of(event);
      }

      // User's preferred language (guaranteed to exist after login)
      const targetLang = translateService.preferredLanguage?.code?.toLowerCase();

      // No translation needed if user prefers English
      if (!targetLang || targetLang === 'en') {
        return of(event);
      }

      // Skip if target language is not supported
      if (!translateService.checkTranslationExists(targetLang)) {
        return of(event);
      }

      // Translate the response body to user's language
      return translateService.getTranslation(body, targetLang).pipe(
        switchMap((translatedBody: any) => {
          // Return a new response with translated content
          const translatedResponse = event.clone({
            body: translatedBody,
          });
          return of(translatedResponse);
        })
      );
    })
  );
};