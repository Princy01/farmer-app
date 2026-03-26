import { Component, Input } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface Language {
  code: string;
  name: string;
}

/**
 * Language selection popover component
 * Displays available languages and handles language selection
 */
@Component({
  selector: 'app-language-popover',
  template: `
    <ion-list>
      <ion-item
        *ngFor="let lang of languages"
        button
        (click)="selectLanguage(lang)"
        [attr.data-testid]="'language-item-' + lang.code"
      >
        <ion-label>{{ lang.name }}</ion-label>
        <ion-icon *ngIf="isSelected(lang.code)" name="checkmark-outline" slot="end"></ion-icon>
      </ion-item>
      <ion-item *ngIf="!languages || languages.length === 0" disabled>
        <ion-label color="medium">No languages available</ion-label>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class LanguagePopoverComponent {
  @Input() languages: Language[] = [];
  @Input() currentLanguage = '';
  @Input() onSelect: (lang: Language) => void = () => {};

  constructor(private readonly popoverCtrl: PopoverController) {}

  /**
   * Check if language is currently selected
   */
  isSelected(code: string): boolean {
    return code === this.currentLanguage;
  }

  /**
   * Handle language selection and close popover
   */
  selectLanguage(lang: Language): void {
    if (!lang || !lang.code) {
      return;
    }
    try {
      this.onSelect(lang);
    } finally {
      this.popoverCtrl.dismiss();
    }
  }
}