import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonicModule,
  NavController,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  globeOutline,
  chevronForwardOutline,
  notificationsOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
  trashOutline,
  helpCircleOutline,
  mailOutline,
  documentTextOutline,
  informationCircleOutline,
  warningOutline,
  logOutOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

interface Language {
  id: number;
  code: string;
  name: string;
}

interface NotificationSettings {
  delivery_reminder: boolean;
  payment_received: boolean;
  system_alerts: boolean;
}

interface AppSettings {
  notifications: NotificationSettings;
  language: string;
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

  settings: AppSettings = {
    notifications: {
      delivery_reminder: true,
      payment_received: true,
      system_alerts: true
    },
    language: 'en'
  };

  languages: Language[] = [
    { id: 1, code: 'en', name: 'English' },
    { id: 2, code: 'hi', name: 'हिन्दी' }
  ];

  currentLanguageName = 'English';
  appVersion = '1.0.0';

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {
    addIcons({
      arrowBackOutline,
      globeOutline,
      chevronForwardOutline,
      notificationsOutline,
      lockClosedOutline,
      shieldCheckmarkOutline,
      trashOutline,
      helpCircleOutline,
      mailOutline,
      documentTextOutline,
      informationCircleOutline,
      warningOutline,
      logOutOutline
    });
  }

  ngOnInit() {
    this.loadSettings();
    this.updateCurrentLanguage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSettings() {
    this.settings.language = this.translate.currentLang || 'en';
  }

  updateCurrentLanguage() {
    const currentLang = this.languages.find(lang => lang.code === this.settings.language);
    this.currentLanguageName = currentLang ? currentLang.name : 'English';
  }

  async changeLanguage() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.SELECT_LANGUAGE'),
      inputs: this.languages.map(lang => ({
        type: 'radio' as const,
        label: lang.name,
        value: lang.code,
        checked: lang.code === this.settings.language
      })),
      buttons: [
        {
          text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('DRIVER_SETTINGS.OK'),
          handler: (selectedCode: string) => {
            if (selectedCode) {
              this.settings.language = selectedCode;
              this.translate.use(selectedCode);
              this.updateCurrentLanguage();
              this.showToast(this.translate.instant('DRIVER_SETTINGS.LANGUAGE_CHANGED'));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleNotification(type: keyof NotificationSettings) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_SETTINGS.UPDATING'),
      duration: 500
    });
    await loading.present();

    setTimeout(async () => {
      await loading.dismiss();
      this.showToast(this.translate.instant('DRIVER_SETTINGS.SETTINGS_UPDATED'));
    }, 500);
  }

  async changePassword() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.CHANGE_PASSWORD'),
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: this.translate.instant('DRIVER_SETTINGS.CURRENT_PASSWORD')
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: this.translate.instant('DRIVER_SETTINGS.NEW_PASSWORD')
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: this.translate.instant('DRIVER_SETTINGS.CONFIRM_PASSWORD')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('DRIVER_SETTINGS.CHANGE'),
          handler: async (data) => {
            if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.ALL_FIELDS_REQUIRED')
              );
              return false;
            }

            if (data.newPassword !== data.confirmPassword) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_MISMATCH')
              );
              return false;
            }

            if (data.newPassword.length < 6) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_TOO_SHORT')
              );
              return false;
            }

            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('DRIVER_SETTINGS.CHANGING_PASSWORD')
            });
            await loading.present();

            setTimeout(async () => {
              await loading.dismiss();
              this.showToast(this.translate.instant('DRIVER_SETTINGS.PASSWORD_CHANGED'));
            }, 1000);

            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async clearCache() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.CLEAR_CACHE'),
      message: this.translate.instant('DRIVER_SETTINGS.CLEAR_CACHE_CONFIRM'),
      buttons: [
        {
          text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('DRIVER_SETTINGS.CLEAR'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('DRIVER_SETTINGS.CLEARING_CACHE')
            });
            await loading.present();

            setTimeout(async () => {
              await loading.dismiss();
              this.showToast(this.translate.instant('DRIVER_SETTINGS.CACHE_CLEARED'));
            }, 1000);
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteAccount() {
    const confirmAlert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.DELETE_ACCOUNT'),
      message: this.translate.instant('DRIVER_SETTINGS.DELETE_ACCOUNT_WARNING'),
      buttons: [
        {
          text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('DRIVER_SETTINGS.DELETE'),
          role: 'destructive',
          handler: async () => {
            const passwordAlert = await this.alertCtrl.create({
              header: this.translate.instant('DRIVER_SETTINGS.CONFIRM_PASSWORD'),
              inputs: [
                {
                  name: 'password',
                  type: 'password',
                  placeholder: this.translate.instant('DRIVER_SETTINGS.ENTER_PASSWORD')
                }
              ],
              buttons: [
                {
                  text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
                  role: 'cancel'
                },
                {
                  text: this.translate.instant('DRIVER_SETTINGS.CONFIRM'),
                  handler: async (data) => {
                    if (!data.password) {
                      this.showErrorAlert(
                        this.translate.instant('DRIVER_SETTINGS.ERROR'),
                        this.translate.instant('DRIVER_SETTINGS.PASSWORD_REQUIRED')
                      );
                      return false;
                    }

                    const loading = await this.loadingCtrl.create({
                      message: this.translate.instant('DRIVER_SETTINGS.DELETING_ACCOUNT')
                    });
                    await loading.present();

                    setTimeout(async () => {
                      await loading.dismiss();
                      this.authService.logout();
                      this.router.navigate(['/login']);
                    }, 1500);

                    return true;
                  }
                }
              ]
            });
            await passwordAlert.present();
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.LOGOUT'),
      message: this.translate.instant('DRIVER_SETTINGS.LOGOUT_CONFIRM'),
      buttons: [
        {
          text: this.translate.instant('DRIVER_SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('DRIVER_SETTINGS.LOGOUT'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  contactSupport() {
    console.log('Contact support');
  }

  viewPrivacyPolicy() {
    console.log('View privacy policy');
  }

  viewTermsOfService() {
    console.log('View terms of service');
  }

  goBack() {
    this.navCtrl.back();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [this.translate.instant('DRIVER_SETTINGS.OK')]
    });
    await alert.present();
  }
}
