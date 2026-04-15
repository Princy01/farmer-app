import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly supportedLangs = ['en', 'hi'];
  private readonly primaryLangKey = 'preferred_language';
  private readonly legacyLangKey = 'appLang';

  constructor(private translate: TranslateService) {
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const storedLang = (
      localStorage.getItem(this.primaryLangKey)
      || localStorage.getItem(this.legacyLangKey)
      || 'en'
    ).toLowerCase();
    const lang = this.supportedLangs.includes(storedLang) ? storedLang : 'en';

    // Keep both keys in sync to support existing modules during migration.
    localStorage.setItem(this.primaryLangKey, lang);
    localStorage.setItem(this.legacyLangKey, lang);

    this.translate.use(lang).pipe(
      catchError(() => {
        localStorage.setItem(this.primaryLangKey, 'en');
        localStorage.setItem(this.legacyLangKey, 'en');
        return this.translate.use('en');
      })
    ).subscribe();
  }
}
