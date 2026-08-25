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
  bookOutline,
  mailOutline,
  documentTextOutline,
  informationCircleOutline,
  warningOutline,
  logOutOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { SettingsService, DriverNotificationSettings, UpdatePasswordRequest, DeleteAccountRequest } from './settings.service';

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
  private previousNotificationSettings: NotificationSettings | null = null;
  isTogglingNotification = false;

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
    private translate: TranslateService,
    private settingsService: SettingsService
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
      bookOutline,
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
    this.settingsService.getNotificationSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (notifications: DriverNotificationSettings) => {
        this.settings.notifications = notifications;
        this.previousNotificationSettings = { ...notifications };
      },
      error: () => {
        this.showErrorAlert(
          this.translate.instant('DRIVER_SETTINGS.ERROR'),
          this.translate.instant('DRIVER_SETTINGS.LOAD_SETTINGS_ERROR')
        );
      }
    });
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
              const normalizedCode = selectedCode.toLowerCase();
              this.settings.language = normalizedCode;
              this.translate.use(normalizedCode);
              this.updateCurrentLanguage();
              this.showToast(this.translate.instant('DRIVER_SETTINGS.LANGUAGE_CHANGED'));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  openHelp(): void {
    this.router.navigate(['/transport/help']);
  }

  async toggleNotification(type: keyof NotificationSettings) {
    if (this.isTogglingNotification) {
      return;
    }

    this.isTogglingNotification = true;
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_SETTINGS.UPDATING'),
      duration: 500
    });
    await loading.present();

    this.settingsService.updateNotificationSettings(this.settings.notifications).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        loading.dismiss();
        this.previousNotificationSettings = { ...this.settings.notifications };
        this.showToast(this.translate.instant('DRIVER_SETTINGS.SETTINGS_UPDATED'));
        this.isTogglingNotification = false;
      },
      error: () => {
        loading.dismiss();
        this.showErrorAlert(
          this.translate.instant('DRIVER_SETTINGS.ERROR'),
          this.translate.instant('DRIVER_SETTINGS.NOTIFICATION_UPDATE_ERROR')
        );
        if (this.previousNotificationSettings) {
          this.settings.notifications = { ...this.previousNotificationSettings };
        }
        this.isTogglingNotification = false;
      }
    });
  }

  async changePassword() {
    const requirementsText = this.passwordRequirements.join(', ');

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('DRIVER_SETTINGS.CHANGE_PASSWORD'),
      message: `Password requirements: ${requirementsText}`,
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

            // Frontend validation matching backend rules
            if (data.newPassword.length < 8) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_MIN_LENGTH')
              );
              return false;
            }

            if (data.currentPassword === data.newPassword) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_MUST_DIFFER')
              );
              return false;
            }

            if (!/[A-Z]/.test(data.newPassword)) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_UPPERCASE')
              );
              return false;
            }

            if (!/[a-z]/.test(data.newPassword)) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_LOWERCASE')
              );
              return false;
            }

            if (!/[0-9]/.test(data.newPassword)) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_NUMBER')
              );
              return false;
            }

            if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
              this.showErrorAlert(
                this.translate.instant('DRIVER_SETTINGS.ERROR'),
                this.translate.instant('DRIVER_SETTINGS.PASSWORD_SPECIAL_CHAR')
              );
              return false;
            }

            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('DRIVER_SETTINGS.CHANGING_PASSWORD')
            });
            await loading.present();

            const req: UpdatePasswordRequest = {
              currentPassword: data.currentPassword,
              newPassword: data.newPassword,
              confirmPassword: data.confirmPassword
            };

            this.settingsService.updatePassword(req).pipe(takeUntil(this.destroy$)).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast(this.translate.instant('DRIVER_SETTINGS.PASSWORD_CHANGED'));
              },
              error: () => {
                loading.dismiss();
                this.showErrorAlert(
                  this.translate.instant('DRIVER_SETTINGS.ERROR'),
                  this.translate.instant('DRIVER_SETTINGS.PASSWORD_CHANGE_ERROR')
                );
                return false;
              }
            });

            return true;
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
                },
                {
                  name: 'confirmation',
                  type: 'text',
                  placeholder: 'Type "DELETE" to confirm'
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
                    if (data.confirmation !== 'DELETE') {
                      this.showErrorAlert(
                        this.translate.instant('DRIVER_SETTINGS.ERROR'),
                        this.translate.instant('DRIVER_SETTINGS.DELETE_CONFIRMATION_TEXT')
                      );
                      return false;
                    }

                    const loading = await this.loadingCtrl.create({
                      message: this.translate.instant('DRIVER_SETTINGS.DELETING_ACCOUNT')
                    });
                    await loading.present();

                    const req: DeleteAccountRequest = {
                      password: data.password,
                      confirmation: data.confirmation
                    };

                    this.settingsService.deleteAccount(req).pipe(takeUntil(this.destroy$)).subscribe({
                      next: () => {
                        loading.dismiss();
                        this.authService.logout();
                        this.router.navigate(['/login']);
                      },
                      error: () => {
                        loading.dismiss();
                        this.showErrorAlert(
                          this.translate.instant('DRIVER_SETTINGS.ERROR'),
                          this.translate.instant('DRIVER_SETTINGS.ACCOUNT_DELETE_ERROR')
                        );
                        return false;
                      }
                    });

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
    this.router.navigate(['/transport/support']);
  }

  viewPrivacyPolicy() {
    this.router.navigate(['/privacy-policy']);
  }

  viewTermsOfService() {
    this.router.navigate(['/terms-of-service']);
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
