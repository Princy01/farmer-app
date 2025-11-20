import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, TranslatePipe ],
})
export class AppComponent {

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'hi']);
    this.translate.setFallbackLang('en');
    const lang = localStorage.getItem('appLang') || 'en';
    this.translate.use('lang');
  }
}
