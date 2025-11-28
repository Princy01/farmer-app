import { Component } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-language-popover',
  template: `
    <ion-list>
      <ion-item *ngFor="let lang of languages" button (click)="selectLanguage(lang)">
        <ion-label>{{ lang.name }}</ion-label>
        <ion-icon *ngIf="lang.name === currentLanguage" name="checkmark-outline" slot="end"></ion-icon>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class LanguagePopoverComponent {
  languages: Language[] = [];
  currentLanguage = '';
  onSelect: (lang: Language) => void = () => {};

  constructor(private popoverCtrl: PopoverController) {}

  selectLanguage(lang: Language) {
    this.onSelect(lang);
    this.popoverCtrl.dismiss();
  }
}