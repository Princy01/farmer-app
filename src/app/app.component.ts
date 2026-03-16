import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'hi']);
    this.translate.setDefaultLang('en');
    const lang = (localStorage.getItem('appLang') || 'en').toLowerCase();
    this.translate.use(lang);
  }
}
