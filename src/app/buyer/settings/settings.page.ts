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
import { TranslateApiService } from '../services/translate-api.service';
import { Subject, takeUntil } from 'rxjs';

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
    'At least 8 characters',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
    'One special character (!@#$%^&* etc.)',
    'Different from current password'
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
    private translateApiService: TranslateApiService
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
    // Load from localStorage
    const savedSettings = localStorage.getItem('retailer_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }

    const savedLang = localStorage.getItem('retailer_language');
    if (savedLang) {
      this.selectedLanguage = savedLang;
      this.settings.language = savedLang;
    }
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

    this.selectedLanguage = langCode;
    this.settings.language = langCode;
    this.translate.use(langCode);
    localStorage.setItem('retailer_language', langCode);

    // Save to backend
    this.translateApiService.setLanguagePreference(lang.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showToast(this.translate.instant('RETAILER_SETTINGS.LANGUAGE_CHANGED'), 'success');
        },
        error: (error) => {
          console.error('Error saving language preference:', error);
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
    const requirementsText = this.passwordRequirements.join(', ');

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.CHANGE_PASSWORD'),
      message: `Password requirements: ${requirementsText}`,
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
      this.showToast('Password must be at least 8 characters long', 'danger');
      return false;
    }

    if (data.currentPassword === data.newPassword) {
      this.showToast('New password must be different from current password', 'danger');
      return false;
    }

    if (!/[A-Z]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one uppercase letter', 'danger');
      return false;
    }

    if (!/[a-z]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one lowercase letter', 'danger');
      return false;
    }

    if (!/[0-9]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one number', 'danger');
      return false;
    }

    if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one special character', 'danger');
      return false;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.CHANGING_PASSWORD')
    });
    await loading.present();

    // Simulate API call - replace with actual service call when available
    setTimeout(async () => {
      await loading.dismiss();
      this.showToast(this.translate.instant('RETAILER_SETTINGS.PASSWORD_CHANGED'), 'success');
    }, 1000);

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
            if (data.confirmation === 'DELETE') {
              this.handleAccountDeletion();
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

  async handleAccountDeletion() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_SETTINGS.DELETING_ACCOUNT')
    });
    await loading.present();

    // Simulate API call
    setTimeout(async () => {
      await loading.dismiss();
      this.authService.logout();
      await this.router.navigate(['/login']);
    }, 2000);
  }

  openHelp() {
    this.router.navigate(['/buyer/help']);
  }

  openPrivacyPolicy() {
    // Open privacy policy page or external link
    window.open('https://example.com/privacy-policy', '_blank');
  }

  openTermsOfService() {
    // Open terms page or external link
    window.open('https://example.com/terms-of-service', '_blank');
  }

  async contactSupport() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant('RETAILER_SETTINGS.CONTACT_SUPPORT'),
      buttons: [
        {
          text: this.translate.instant('RETAILER_SETTINGS.EMAIL_SUPPORT'),
          icon: 'mail-outline',
          handler: () => {
            window.location.href = 'mailto:support@example.com';
          }
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.CALL_SUPPORT'),
          icon: 'phone-portrait-outline',
          handler: () => {
            window.location.href = 'tel:+911234567890';
          }
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.LIVE_CHAT'),
          icon: 'chatbubbles-outline',
          handler: () => {
            this.showToast(this.translate.instant('RETAILER_SETTINGS.CHAT_COMING_SOON'), 'primary');
          }
        },
        {
          text: this.translate.instant('RETAILER_SETTINGS.CANCEL'),
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
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
