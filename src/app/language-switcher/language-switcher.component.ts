import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { IonicModule } from "@ionic/angular";

@Component({
        selector: 'app-language-switcher',
        standalone: true,
        templateUrl: './language-switcher.component.html',
        styleUrls: ['./language-switcher.component.scss'],
        imports: [CommonModule, IonicModule]
})
export class LanguageSwitcherComponent {
        languages = [
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी' }
        ];
        currentLang = (localStorage.getItem('preferred_language') || localStorage.getItem('appLang') || 'en').toLowerCase();

        constructor(private translate: TranslateService) { }

        switchLanguage(lang: string | number | undefined | null) {
                if (!lang) {
                        return;
                }
                const normalizedLang = String(lang).toLowerCase();
                this.currentLang = normalizedLang;
                this.translate.use(normalizedLang);
                localStorage.setItem('preferred_language', normalizedLang);
                localStorage.setItem('appLang', normalizedLang);
        }
}
