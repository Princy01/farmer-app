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

  constructor(private translate: TranslateService) {
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const storedLang = (localStorage.getItem('appLang') || 'en').toLowerCase();
    const lang = this.supportedLangs.includes(storedLang) ? storedLang : 'en';

    this.translate.use(lang).pipe(
      catchError(() => {
        localStorage.setItem('appLang', 'en');
        return this.translate.use('en');
      })
    ).subscribe();
  }
}
