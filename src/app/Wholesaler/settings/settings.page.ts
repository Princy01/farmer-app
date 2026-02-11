import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, NavController, AlertController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { TranslateModule, TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { arrowBackOutline, notificationsOutline, lockClosedOutline, shieldCheckmarkOutline, helpCircleOutline, documentTextOutline, informationCircleOutline, trashOutline, downloadOutline, phonePortraitOutline, mailOutline, chatbubblesOutline, checkmarkOutline, chevronForwardOutline, sunnyOutline, pricetagOutline, reloadOutline, receiptOutline, cubeOutline, warningOutline } from 'ionicons/icons';
import { AuthService } from '../../auth/auth.service';
import { WholesalerSettingsService, UserSettings, UpdatePasswordRequest, DeleteAccountRequest } from './settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, TranslateModule]
})
export class SettingsPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  settingsForm: FormGroup; // Reactive form for UserSettings

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
    private fb: FormBuilder,
    private settingsService: WholesalerSettingsService
  ) {
    addIcons({
      arrowBackOutline, notificationsOutline,
      lockClosedOutline, shieldCheckmarkOutline, helpCircleOutline,
      documentTextOutline, informationCircleOutline, trashOutline,
      downloadOutline, phonePortraitOutline, mailOutline, chatbubblesOutline,
      checkmarkOutline, chevronForwardOutline, sunnyOutline, pricetagOutline
    });

    this.settingsForm = this.fb.group({
      orderUpdates: [true],
      priceAlerts: [true],
      stockAlerts: [true],
      marketingEmails: [false],
      smsNotifications: [true],
      autoRefresh: [true]
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSettings() {
    this.settingsService.getSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings: UserSettings) => {
        this.settingsForm.patchValue(settings);
        localStorage.setItem('wholesaler_settings', JSON.stringify(settings));
      },
      error: (error: any) => {
        console.error('Error loading settings:', error);
        this.loadFromLocalStorage();
      }
    });
  }

  loadFromLocalStorage() {
    const savedSettings = localStorage.getItem('wholesaler_settings');
    if (savedSettings) {
      this.settingsForm.patchValue(JSON.parse(savedSettings));
    }
  }

  async saveSettings() {
    if (this.settingsForm.invalid) return;
    const settings = this.settingsForm.value;
    this.settingsService.updateSettings(settings).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        localStorage.setItem('wholesaler_settings', JSON.stringify(settings));
        this.showToast(this.translate.instant('SETTINGS.SAVE_SUCCESS'), 'success');
      },
      error: (error) => {
        this.showToast(error.message || this.translate.instant('SETTINGS.SAVE_ERROR'), 'danger');
      }
    });
  }

  toggleNotification(key: keyof Pick<UserSettings, 'orderUpdates' | 'priceAlerts' | 'stockAlerts' | 'marketingEmails' | 'smsNotifications'>, event: any) {
    this.settingsForm.get(key)?.setValue(event.detail.checked);
    this.saveSettings();
  }

  toggleAutoRefresh(event: any) {
    this.settingsForm.get('autoRefresh')?.setValue(event.detail.checked);
    this.saveSettings();
  }

  async changePassword() {
    const requirementsText = this.passwordRequirements.join(', ');

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('SETTINGS.CHANGE_PASSWORD'),
      message: `Password requirements: ${requirementsText}`,
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: this.translate.instant('SETTINGS.CURRENT_PASSWORD')
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: this.translate.instant('SETTINGS.NEW_PASSWORD')
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: this.translate.instant('SETTINGS.CONFIRM_PASSWORD')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('SETTINGS.CHANGE'),
          handler: (data) => {
            this.handlePasswordChange(data);
          }
        }
      ]
    });
    await alert.present();
  }

  async handlePasswordChange(data: any) {
    // Frontend validation matching backend rules
    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      this.showToast(this.translate.instant('SETTINGS.ALL_FIELDS_REQUIRED'), 'danger');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      this.showToast(this.translate.instant('SETTINGS.PASSWORD_MISMATCH'), 'danger');
      return;
    }

    if (data.newPassword.length < 8) {
      this.showToast('Password must be at least 8 characters long', 'danger');
      return;
    }

    if (data.currentPassword === data.newPassword) {
      this.showToast('New password must be different from current password', 'danger');
      return;
    }

    if (!/[A-Z]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one uppercase letter', 'danger');
      return;
    }

    if (!/[a-z]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one lowercase letter', 'danger');
      return;
    }

    if (!/[0-9]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one number', 'danger');
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
      this.showToast('Password must contain at least one special character', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('SETTINGS.CHANGING_PASSWORD')
    });
    await loading.present();

    this.settingsService.changePassword(data).pipe(takeUntil(this.destroy$)).subscribe({
      next: async () => {
        await loading.dismiss();
        this.showToast(this.translate.instant('SETTINGS.PASSWORD_CHANGED'), 'success');
      },
      error: async (error: any) => {
        await loading.dismiss();
        this.showToast(error.message || this.translate.instant('SETTINGS.PASSWORD_CHANGE_ERROR'), 'danger');
      }
    });
  }

  async deleteAccount() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('SETTINGS.DELETE_ACCOUNT'),
      message: this.translate.instant('SETTINGS.DELETE_ACCOUNT_WARNING'),
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: this.translate.instant('SETTINGS.CURRENT_PASSWORD')
        },
        {
          name: 'confirmation',
          type: 'text',
          placeholder: this.translate.instant('SETTINGS.TYPE_DELETE')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('SETTINGS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('SETTINGS.DELETE'),
          role: 'destructive',
          handler: (data) => {
            if (data.confirmation === 'DELETE' && data.password) {
              this.handleAccountDeletion(data.password);
              return true;
            } else {
              this.showToast(this.translate.instant('SETTINGS.INVALID_CONFIRMATION'), 'danger');
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
      message: this.translate.instant('SETTINGS.DELETING_ACCOUNT')
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
        this.showToast(error.message || this.translate.instant('SETTINGS.DELETE_ERROR'), 'danger');
      }
    });
  }

  openHelp() {
    this.router.navigate(['/wholesaler/help']);
  }

  openPrivacyPolicy() {
    window.open('https://example.com/privacy-policy', '_blank');
  }

  openTermsOfService() {
    window.open('https://example.com/terms-of-service', '_blank');
  }

  async contactSupport() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant('SETTINGS.CONTACT_SUPPORT'),
      buttons: [
        {
          text: this.translate.instant('SETTINGS.EMAIL_SUPPORT'),
          icon: 'mail-outline',
          handler: () => {
            window.location.href = 'mailto:support@example.com';
          }
        },
        {
          text: this.translate.instant('SETTINGS.CALL_SUPPORT'),
          icon: 'phone-portrait-outline',
          handler: () => {
            window.location.href = 'tel:+911234567890';
          }
        },
        {
          text: this.translate.instant('SETTINGS.LIVE_CHAT'),
          icon: 'chatbubbles-outline',
          handler: () => {
            this.showToast(this.translate.instant('SETTINGS.CHAT_COMING_SOON'), 'primary');
          }
        },
        {
          text: this.translate.instant('SETTINGS.CANCEL'),
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