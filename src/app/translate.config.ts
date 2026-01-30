import { importProvidersFrom } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, provideTranslateHttpLoader } from '@ngx-translate/http-loader';

/**
 * Factory function to create TranslateHttpLoader (for module-based approach)
 * @param http HttpClient instance for making HTTP requests
 * @returns TranslateHttpLoader configured for loading translation files
 * @deprecated Use provideTranslateHttpLoader for standalone applications
 */
export function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader();
}

/**
 * Translation module configuration providers (for module-based approach)
 * Configures ngx-translate with HTTP loader for loading translation files
 *
 * @deprecated For standalone applications, use provideTranslateService with provideTranslateHttpLoader instead.
 * Example:
 * ```typescript
 * provideTranslateService({
 *   loader: provideTranslateHttpLoader({
 *     prefix: './assets/i18n/',
 *     suffix: '.json'
 *   }),
 *   defaultLanguage: 'en'
 * })
 * ```
 */
export const TRANSLATE_PROVIDERS = [
  importProvidersFrom(
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  )
];