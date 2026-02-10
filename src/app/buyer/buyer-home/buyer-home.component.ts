import { Component, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, MenuController, AlertController, PopoverController, ToastController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BuyerApiService, Category } from '../services/buyer-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { addIcons } from 'ionicons';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
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
  chevronDownOutline,
  businessOutline
} from 'ionicons/icons';
import { LanguagePopoverComponent } from './language-popover.component';
import { TranslateApiService } from '../services/translate-api.service';

interface UserPreference {
  language: string;
  code: string;
}

interface Language {
  id: number;
  code: string;
  name: string;
}

@Component({
  selector: 'app-buyer-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, TranslateModule, LanguagePopoverComponent],
  templateUrl: './buyer-home.component.html',
  styleUrls: ['./buyer-home.component.scss'],
})
export class BuyerHomeComponent implements OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categories: Category[] = [];
  languages: Language[] = [];
  currentLanguage = 'English';
  userPreference: UserPreference | null = null;

  private destroy$ = new Subject<void>();
  private readonly DEFAULT_CATEGORY_IMAGE = 'assets/images/category-placeholder.png';

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private buyerApiService: BuyerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private popoverCtrl: PopoverController,
    private translateApiService: TranslateApiService,
    private toastCtrl: ToastController
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
      chevronDownOutline,
      businessOutline
    });

    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.fetchCategories();
    this.fetchUserPreference();
    this.fetchLanguages();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchLanguages() {
    this.translateApiService.getLanguages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (languages) => {
          this.languages = languages.map(lang => ({
            ...lang,
            code: lang.code.toLowerCase()
          }));
        },
        error: (error) => {
          console.error('Error fetching languages:', error);
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_LANGUAGES');
          this.languages = [
            { id: 1, code: 'en', name: 'English' },
            { id: 2, code: 'es', name: 'Español' },
            { id: 3, code: 'fr', name: 'Français' }
          ];
        }
      });
  }

  fetchUserPreference() {
    this.translateApiService.getUserPreference()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pref) => {
          if (!pref || !pref.code) {
            this.userPreference = { language: 'en', code: 'en' };
            this.setLanguage('en');
            return;
          }
          const normalizedLang = pref.code.toLowerCase();
          this.userPreference = { ...pref, language: normalizedLang };
          this.setLanguage(normalizedLang);
        },
        error: (error) => {
          console.error('Error fetching user preference:', error);
          this.userPreference = { language: 'en', code: 'en' };
          this.setLanguage('en');
        }
      });
  }

  setLanguage(langCode: string) {
    this.translate.use(langCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const lang = this.languages.find(l => l.code === langCode);
          this.currentLanguage = lang?.name || 'English';
        },
        error: (err) => {
          console.error('Error loading translation file for', langCode, err);
          this.translate.use('en');
          this.currentLanguage = 'English';
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_TRANSLATIONS');
        }
      });
  }

  saveLanguagePreference(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) {
      console.error('Language not found:', langCode);
      return;
    }

    this.translateApiService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.setLanguage(langCode);
          this.showSuccessToast('BUYER_HOME.LANGUAGE_UPDATED');
        },
        error: (error) => {
          console.error('Error saving language preference:', error);
          this.showErrorToast('BUYER_HOME.ERROR_SAVING_LANGUAGE');
        }
      });
  }

  async openLanguagePopover(event: Event) {
    try {
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
    } catch (error) {
      console.error('Error opening language popover:', error);
      this.showErrorToast('BUYER_HOME.ERROR_OPENING_MENU');
    }
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.errorLoadingCategories = false;

    this.buyerApiService.getSuperCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response || [];
          this.loadingCategories = false;
        },
        error: (error) => {
          this.errorLoadingCategories = true;
          this.loadingCategories = false;
          console.error('Error fetching categories:', error);
          this.showErrorToast('BUYER_HOME.ERROR_LOADING_CATEGORIES_DESC');
        }
      });
  }

  onScroll(event: any) {
    if (event?.detail?.scrollTop !== undefined) {
      this.hideHeader = event.detail.scrollTop > 100;
    }
  }

  onImageError(target: any) {
    if (target) {
      target.src = this.DEFAULT_CATEGORY_IMAGE;
    }
  }

  getImagePath(category: Category): string {
    return category.img_path || this.DEFAULT_CATEGORY_IMAGE;
  }

  async openMenu() {
    try {
      await this.menuCtrl.open('buyer-menu');
    } catch (error) {
      console.error('Error opening menu:', error);
    }
  }

  async closeMenu() {
    try {
      await this.menuCtrl.close('buyer-menu');
    } catch (error) {
      console.error('Error closing menu:', error);
    }
  }

  async navigateToProfile() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/profile']);
    } catch (error) {
      console.error('Error navigating to profile:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToOrderHistory() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/retailer-order-history'], {
        queryParams: { id: 'ORD123456' }
      });
    } catch (error) {
      console.error('Error navigating to order history:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToBusinessLocations() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/business-locations']);
    } catch (error) {
      console.error('Error navigating to business locations:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToBusinessInfo() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/business-info']);
    } catch (error) {
      console.error('Error navigating to business info:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToUpdateBusiness() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/business-update']);
    } catch (error) {
      console.error('Error navigating to business update:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async navigateToSettings() {
    try {
      await this.closeMenu();
      await this.router.navigate(['/buyer/settings']);
    } catch (error) {
      console.error('Error navigating to settings:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  async logout() {
    try {
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
            handler: async () => {
              try {
                await this.authService.logout();
                await this.router.navigate(['/login']);
              } catch (error) {
                console.error('Error during logout:', error);
                this.showErrorToast('BUYER_HOME.LOGOUT_ERROR');
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Error showing logout confirmation:', error);
      this.showErrorToast('BUYER_HOME.ERROR_OPENING_MENU');
    }
  }

  async openTrends() {
    try {
      await this.router.navigate(['/buyer/RetailerTrends']);
    } catch (error) {
      console.error('Error navigating to trends:', error);
      this.showErrorToast('BUYER_HOME.NAVIGATION_ERROR');
    }
  }

  private async showErrorToast(messageKey: string) {
    try {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant(messageKey),
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  private async showSuccessToast(messageKey: string) {
    try {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant(messageKey),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }
}