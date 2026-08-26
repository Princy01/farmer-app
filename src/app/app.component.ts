import { Component, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';

interface IonicBackButtonEvent extends CustomEvent {
  detail: {
    register: (priority: number, handler: () => void) => void;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  private readonly supportedLangs = ['en', 'hi'];
  private readonly primaryLangKey = 'preferred_language';
  private readonly legacyLangKey = 'appLang';
  private readonly isStandalonePwa = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  private readonly handlePwaBackButton = (event: Event): void => {
    const backButtonEvent = event as IonicBackButtonEvent;
    backButtonEvent.detail.register(1, () => {
      if (window.history.length > 1) {
        this.location.back();
      }
    });
  };

  constructor(
    private translate: TranslateService,
    private location: Location,
  ) {
    if (this.isStandalonePwa) {
      document.addEventListener('ionBackButton', this.handlePwaBackButton);
    }

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

  ngOnDestroy(): void {
    if (this.isStandalonePwa) {
      document.removeEventListener('ionBackButton', this.handlePwaBackButton);
    }
  }
}
