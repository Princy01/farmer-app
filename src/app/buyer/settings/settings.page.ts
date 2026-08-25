import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonicModule,
  NavController,
  AlertController,
  LoadingController,
  ToastController,
  ActionSheetController
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, notificationsOutline, languageOutline,
  lockClosedOutline, shieldCheckmarkOutline, helpCircleOutline,
  documentTextOutline, informationCircleOutline, trashOutline,
  downloadOutline, phonePortraitOutline, mailOutline, chatbubblesOutline,
  checkmarkOutline, chevronForwardOutline, sunnyOutline, pricetagOutline,
  receiptOutline, cubeOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateApiService } from '../../services/translate-api.service';
import { Subject, takeUntil } from 'rxjs';
import { RetailerSettingsService } from './settings.service';
import { environment } from 'src/environments/environment';

interface Language {
  id: number;
  code: string;
  name: string;
}

interface NotificationSettings {
  orderUpdates: boolean;
  priceAlerts: boolean;
  stockAlerts: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
}

interface AppSettings {
  language: string;
  notifications: NotificationSettings;
  autoRefresh: boolean;
  soundEffects: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class SettingsPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  languages: Language[] = [];
  selectedLanguage = 'en';

  settings: AppSettings = {
    language: 'en',
    notifications: {
      orderUpdates: true,
      priceAlerts: true,
      stockAlerts: true,
      marketingEmails: false,
      smsNotifications: true
    },
    autoRefresh: true,
    soundEffects: false
  };

  appVersion = '1.0.0';
  isLoading = false;
  passwordRequirements = [
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_MIN_LENGTH'),
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_UPPERCASE_REQUIRED'),
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_LOWERCASE_REQUIRED'),
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_NUMBER_REQUIRED'),
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_SPECIAL_REQUIRED'),
    this.translate.instant('RETAILER_SETTINGS.PASSWORD_SAME_AS_CURRENT')
  ];

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private translate: TranslateService,
    private translateApiService: TranslateApiService,
    private settingsService: RetailerSettingsService
  ) {
    addIcons({
      arrowBackOutline, notificationsOutline, languageOutline,
      lockClosedOutline, shieldCheckmarkOutline, helpCircleOutline,
      documentTextOutline, informationCircleOutline, trashOutline,
      downloadOutline, phonePortraitOutline, mailOutline, chatbubblesOutline,
      checkmarkOutline, chevronForwardOutline, sunnyOutline, pricetagOutline,
      receiptOutline, cubeOutline
    });
  }

  ngOnInit() {
    this.loadSettings();
    this.fetchLanguages();
  }

  getCurrentLanguageName(): string {
    const lang = this.languages.find(l => l.code === this.selectedLanguage);
    return lang ? lang.name : 'English';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSettings() {
    // Load from localStorage first
    const savedSettings = localStorage.getItem('retailer_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }

    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang) {
      this.selectedLanguage = savedLang;
      this.settings.language = savedLang;
    }

    // Load from API
    this.settingsService.getSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (apiSettings: any) => {
        this.settings.notifications = {
          orderUpdates: apiSettings.orderUpdates,
          priceAlerts: apiSettings.priceAlerts,
          stockAlerts: apiSettings.stockAlerts,
          marketingEmails: apiSettings.marketingEmails,
          smsNotifications: apiSettings.smsNotifications
        };
        this.settings.autoRefresh = apiSettings.autoRefresh;
        localStorage.setItem('retailer_settings', JSON.stringify(this.settings));
      },
      error: (error: any) => {
        // Silently fail - use localStorage values
      }
    });
  }

  fetchLanguages() {
    // Only English and Hindi are available
    this.languages = [
      { id: 1, code: 'en', name: 'English' },
      { id: 2, code: 'hi', name: 'हिन्दी' }
    ];
  }

  async saveSettings() {
    localStorage.setItem('retailer_settings', JSON.stringify(this.settings));

    this.settingsService.updateSettings({
      orderUpdates: this.settings.notifications.orderUpdates,
      priceAlerts: this.settings.notifications.priceAlerts,
      stockAlerts: this.settings.notifications.stockAlerts,
      marketingEmails: this.settings.notifications.marketingEmails,
      smsNotifications: this.settings.notifications.smsNotifications,
      autoRefresh: this.settings.autoRefresh
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Already saved to localStorage
      },
      error: (error) => {
        this.showToast(error.message || this.translate.instant('RETAILER_SETTINGS.SAVE_ERROR'), 'danger');
      }
    });

    const toast = await this.toastCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.SAVE_SUCCESS'),
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  async selectLanguage() {
    const buttons: any[] = this.languages.map(lang => ({
      text: lang.name,
      icon: this.selectedLanguage === lang.code ? 'checkmark-outline' : undefined,
      handler: () => {
        this.changeLanguage(lang.code);
      }
    }));

    buttons.push({
      text: this.translate.instant('RETAILER_SETTINGS.CANCEL'),
      role: 'cancel',
      handler: () => {}
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.SELECT_LANGUAGE'),
      buttons
    });

    await actionSheet.present();
  }

  async changeLanguage(langCode: string) {
    const lang = this.languages.find(l => l.code === langCode);
    if (!lang) return;

    const normalizedLangCode = langCode.toLowerCase();
    this.selectedLanguage = normalizedLangCode;
    this.settings.language = normalizedLangCode;
    this.translate.use(normalizedLangCode);
    localStorage.setItem('preferred_language', normalizedLangCode);

    // Reinitialize password requirements after language change
    this.passwordRequirements = [
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_MIN_LENGTH'),
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_UPPERCASE_REQUIRED'),
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_LOWERCASE_REQUIRED'),
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_NUMBER_REQUIRED'),
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_SPECIAL_REQUIRED'),
      this.translate.instant('RETAILER_SETTINGS.PASSWORD_SAME_AS_CURRENT')
    ];

    // Save to backend
    this.translateApiService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(this.translate.instant('RETAILER_SETTINGS.LANGUAGE_CHANGED'), 'success');
        },
        error: (error) => {
          // Silently fail - language preference already set locally
        }
      });
  }

  toggleNotification(key: keyof NotificationSettings, event: any) {
    this.settings.notifications[key] = event.detail.checked;
    this.saveSettings();
  }

  toggleAutoRefresh(event: any) {
    this.settings.autoRefresh = event.detail.checked;
    this.saveSettings();
  }

  toggleSoundEffects(event: any) {
    this.settings.soundEffects = event.detail.checked;
    this.saveSettings();
  }

  async changePassword() {
    const requirementsText = this.passwordRequirements.join('\n');

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.CHANGE_PASSWORD'),
      message: requirementsText,
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: this.translate.instant('RETAILER_SETTINGS.CURRENT_PASSWORD')
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: this.translate.instant('RETAILER_SETTINGS.NEW_PASSWORD')
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: this.translate.instant('RETAILER_SETTINGS.CONFIRM_PASSWORD')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('RETAILER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.CHANGE'),
          handler: (data) => {
            this.handlePasswordChange(data);
          }
        }
      ]
    });

    await alert.present();
  }

  async handlePasswordChange(data: any) {
    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.ALL_FIELDS_REQUIRED'), 'danger');
      return false;
    }

    if (data.newPassword !== data.confirmPassword) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORDS_DONT_MATCH'), 'danger');
      return false;
    }

    // Frontend validation matching backend rules
    if (data.newPassword.length < 8) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_MIN_LENGTH'), 'danger');
      return false;
    }

    if (data.currentPassword === data.newPassword) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_SAME_AS_CURRENT'), 'danger');
      return false;
    }

    if (!/[A-Z]/.test(data.newPassword)) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_UPPERCASE_REQUIRED'), 'danger');
      return false;
    }

    if (!/[a-z]/.test(data.newPassword)) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_LOWERCASE_REQUIRED'), 'danger');
      return false;
    }

    if (!/[0-9]/.test(data.newPassword)) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_NUMBER_REQUIRED'), 'danger');
      return false;
    }

    if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_SPECIAL_REQUIRED'), 'danger');
      return false;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.CHANGING_PASSWORD')
    });
    await loading.present();

    this.settingsService.changePassword(data).pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        await loading.dismiss();
        this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_CHANGED'), 'success');
      },
      error: async (error: any) => {
        await loading.dismiss();
        this.showToast(error.message || this.translate.instant('RETAILER_SETTINGS.PASSWORD_CHANGE_ERROR'), 'danger');
      }
    });

    return true;
  }

  async clearCache() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.CLEAR_CACHE'),
      message: this.translate.instant('RETAILER_SETTINGS.CLEAR_CACHE_CONFIRM'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.CLEAR'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('RETAILER_SETTINGS.CLEARING_CACHE')
            });
            await loading.present();

            setTimeout(async () => {
              // Clear specific cache items (not auth tokens)
              const keysToKeep = ['access_token', 'refresh_token', 'user_role', 'user_id'];
              const allKeys = Object.keys(localStorage);
              allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                  localStorage.removeItem(key);
                }
              });

              await loading.dismiss();
              this.showToast(this.translate.instant('RETAILER_SETTINGS.CACHE_CLEARED'), 'success');
            }, 1000);
          }
        }
      ]
    });

    await alert.present();
  }

  async downloadData() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.DOWNLOADING_DATA')
    });
    await loading.present();

    // Simulate data download
    setTimeout(async () => {
      await loading.dismiss();
      this.showToast(this.translate.instant('RETAILER_SETTINGS.DATA_DOWNLOADED'), 'success');
    }, 2000);
  }

  async deleteAccount() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.DELETE_ACCOUNT'),
      message: this.translate.instant('RETAILER_SETTINGS.DELETE_ACCOUNT_WARNING'),
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: this.translate.instant('RETAILER_SETTINGS.CURRENT_PASSWORD')
        },
        {
          name: 'confirmation',
          type: 'text',
          placeholder: this.translate.instant('RETAILER_SETTINGS.TYPE_DELETE')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('RETAILER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.DELETE'),
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation === 'DELETE' && data.password) {
              this.handleAccountDeletion(data.password);
              return true;
            } else {
              this.showToast(this.translate.instant('RETAILER_SETTINGS.INVALID_CONFIRMATION'), 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async handleAccountDeletion(password: string) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.DELETING_ACCOUNT')
    });
    await loading.present();

    this.settingsService.deleteAccount({
      password: password,
      confirmation: 'DELETE'
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        await loading.dismiss();
        this.authService.logout();
        await this.router.navigate(['/login']);
      },
      error: async (error: any) => {
        await loading.dismiss();
        this.showToast(error.message || this.translate.instant('RETAILER_SETTINGS.DELETE_ERROR'), 'danger');
      }
    });
  }

  openHelp() {
    this.router.navigate(['/buyer/help']);
  }

  openPrivacyPolicy() {
    window.open(environment.privacyPolicyUrl, '_blank');
  }

  openTermsOfService() {
    window.open(environment.termsOfServiceUrl, '_blank');
  }

  async contactSupport() {
    await this.router.navigate(['/buyer/support']);
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
