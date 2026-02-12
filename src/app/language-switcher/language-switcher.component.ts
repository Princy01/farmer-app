import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonicModule } from "@ionic/angular";

@Component({
        selector: 'app-language-switcher',
        templateUrl: './language-switcher.component.html',
        //   styleUrls: ['./language-switcher.component.scss'],
        imports: [IonicModule]
})
export class LanguageSwitcherComponent {
        languages = [
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी' }
        ];

        constructor(private translate: TranslateService) { }

        switchLanguage(lang: string) {
                const normalizedLang = lang.toLowerCase();
                this.translate.use(normalizedLang);
                localStorage.setItem('appLang', normalizedLang);
        }
}