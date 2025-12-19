import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, MenuController, AlertController, PopoverController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BuyerApiService } from '../services/buyer-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { addIcons } from 'ionicons';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  personCircleOutline,
  locationOutline,
  chevronForwardOutline,
  heartOutline,
  cartOutline,
  personOutline,
  archiveOutline,
  linkOutline,
  settingsOutline,
  closeOutline,
  statsChartOutline,
  gridOutline,
  alertCircleOutline,
  refreshOutline,
  menuOutline,
  createOutline,
  logOutOutline,
  languageOutline,
  chevronDownOutline
} from 'ionicons/icons';
import { LanguagePopoverComponent } from './language-popover.component';
import { TranslateApiService } from '../services/translate-api.service';

// Simple model for user preferences (expand as needed)
interface UserPreference {
  language: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
}
interface Category {
  id: number;
  name: string;
  image: string;
}

@Component({
  selector: 'app-buyer-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslateModule, LanguagePopoverComponent],
  templateUrl: './buyer-home.component.html',
  styleUrls: ['./buyer-home.component.scss'],
})
export class BuyerHomeComponent {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categories: any[] = [];
  languages: Language[] = [];
  currentLanguage = 'English'; // Default
  userPreference: UserPreference | null = null;

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private buyerApiService: BuyerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
    private translateApiService: TranslateApiService
  ) {
    addIcons({
      personCircleOutline,
      locationOutline,
      chevronForwardOutline,
      heartOutline,
      cartOutline,
      personOutline,
      archiveOutline,
      linkOutline,
      settingsOutline,
      closeOutline,
      statsChartOutline,
      gridOutline,
      alertCircleOutline,
      refreshOutline,
      menuOutline,
      createOutline,
      logOutOutline,
      languageOutline,
      chevronDownOutline
    });

  // Set default language
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.fetchCategories();
    this.fetchUserPreference();
    this.fetchLanguages();
  }

  fetchLanguages() {
    this.translateApiService.getLanguages().subscribe({
      next: (languages) => {
        this.languages = languages.map(lang => ({ ...lang, code: lang.code.toLowerCase() }));
      },
      error: (error) => {
        console.error('Error fetching languages:', error);
        // Fallback with lowercase codes
        this.languages = [
          { id: 1, code: 'en', name: 'English' },
          { id: 2, code: 'es', name: 'Español' },
          { id: 3, code: 'fr', name: 'Français' }
        ];
      }
    });
  }

  fetchUserPreference() {
    this.translateApiService.getUserPreference().subscribe({
      next: (pref) => {
        const normalizedLang = pref.code.toLowerCase();
        this.userPreference = { ...pref, language: normalizedLang };
        this.setLanguage(normalizedLang);
      },
      error: (error) => {
        console.error('Error fetching user preference:', error);
        // Fallback with lowercase
        this.userPreference = { language: 'en' };
        this.setLanguage('en');
      }
    });
  }

  // Set language using ngx-translate
  setLanguage(langCode: string) {
    this.translate.use(langCode).subscribe({
      next: () => {
        console.log('Language set to', langCode);
        console.log(this.languages);
        const lang = this.languages.find(l => l.code === langCode);
        console.log(lang);
        this.currentLanguage = lang ? lang.name : 'English';
      },
      error: (err) => {
        console.error('Error loading translation file for', langCode, err);
        // Fallback to default language
        this.translate.use('en');
        this.currentLanguage = 'English';
      }
    });
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (lang) {
      // Send the original ID to backend (no change needed here)
      this.translateApiService.setLanguagePreference(lang.id).subscribe({
        next: () => {
          this.setLanguage(langCode);
        },
        error: (error) => {
          console.error('Error saving language preference:', error);
          // Optionally show an alert
        }
      });
    }
  }

  async openLanguagePopover(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: LanguagePopoverComponent,
      event: event,
      translucent: true,
      componentProps: {
        languages: this.languages,
        currentLanguage: this.currentLanguage,
        onSelect: (lang: Language) => this.saveLanguagePreference(lang.code)
      }
    });
    await popover.present();
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.errorLoadingCategories = false;

    this.buyerApiService.getSuperCategories().subscribe({
      next: (response) => {
        this.categories = response;
        this.loadingCategories = false;
        console.log('Categories:', this.categories);
      },
      error: (error) => {
        this.errorLoadingCategories = true;
        this.loadingCategories = false;
        console.error('Error fetching categories:', error);
      }
    });
  }

  onScroll(event: any) {
    this.hideHeader = event.detail.scrollTop > 100;
  }

  onImageError(event: any) {
    event.target.src = '';
  }

  openMenu() {
    this.menuCtrl.open('buyer-menu');
  }

  closeMenu() {
    this.menuCtrl.close('buyer-menu');
  }

  async navigateToProfile() {
    await this.closeMenu();
    this.router.navigate(['/buyer/profile']);
  }

  async navigateToOrderHistory() {
    await this.closeMenu();
    this.router.navigate(['/buyer/retailer-order-history'], {
      queryParams: { id: 'ORD123456' }
    });
  }

  navigateToBusinessLocations() {
    this.router.navigate(['/buyer/business-locations']);
  }

  navigateToUpdateBusiness() {
    this.router.navigate(['/buyer/business-update']);
  }

  async navigateToSettings() {
    await this.closeMenu();
    this.router.navigate(['/buyer/settings']);
  }

  async logout() {
    await this.closeMenu();

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('BUYER_HOME.LOGOUT_CONFIRM_HEADER'),
      message: this.translate.instant('BUYER_HOME.LOGOUT_CONFIRM_MESSAGE'),
      buttons: [
        {
          text: this.translate.instant('BUYER_HOME.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('BUYER_HOME.LOGOUT'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  openTrends() {
    this.router.navigate(['/buyer/RetailerTrends']);
  }
}