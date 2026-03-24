import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { BusinessInfoService } from './business-info.service';

@Component({
  selector: 'app-email-verification-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslatePipe],
  template: `
    <ion-header mode="ios">
      <ion-toolbar>
        <ion-title>{{ 'WHOLESALER_BUSINESS_INFO.Update Email' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()" color="medium">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modal-ion-content">
      <div class="modal-wrapper">

        <!-- Step 1: Enter New Email -->
        <div *ngIf="currentStep === 'email'" class="step-card">
          <div class="step-header">
            <h2>{{ 'WHOLESALER_BUSINESS_INFO.Enter New Email' | translate }}</h2>
            <p class="step-subtitle">
              {{ 'WHOLESALER_BUSINESS_INFO.We will send a verification link to your new address' | translate }}
            </p>
          </div>

          <form [formGroup]="emailForm" (ngSubmit)="requestEmailChange()">
            <div class="input-group" [class.has-error]="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched">
              <label class="input-label">{{ 'WHOLESALER_BUSINESS_INFO.New Email Address' | translate }}</label>
              <div class="input-wrap">
                <ion-icon name="at-outline" class="input-icon"></ion-icon>
                <ion-input
                  formControlName="newEmail"
                  type="email"
                  placeholder="name@example.com"
                  class="custom-input">
                </ion-input>
              </div>
              <div class="error-message" *ngIf="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched">
                <ion-icon name="alert-circle-outline"></ion-icon>
                <span *ngIf="emailForm.get('newEmail')?.errors?.['required']">
                  {{ 'WHOLESALER_BUSINESS_INFO.Email is required' | translate }}
                </span>
                <span *ngIf="emailForm.get('newEmail')?.errors?.['email']">
                  {{ 'WHOLESALER_BUSINESS_INFO.Please enter a valid email' | translate }}
                </span>
              </div>
            </div>

            <ion-button expand="block" type="submit" [disabled]="emailForm.invalid || isLoading" class="primary-btn">
              <ion-icon name="send-outline" slot="start" *ngIf="!isLoading"></ion-icon>
              <ion-spinner *ngIf="isLoading" name="crescent" slot="start"></ion-spinner>
              <span>{{ 'WHOLESALER_BUSINESS_INFO.Send Verification' | translate }}</span>
            </ion-button>
          </form>
        </div>

        <!-- Step 2: Email sent confirmation -->
        <div *ngIf="currentStep === 'sent'" class="step-card success-card">
          <div class="success-circle">
            <ion-icon name="paper-plane-outline"></ion-icon>
          </div>
          <h2>{{ 'WHOLESALER_BUSINESS_INFO.Check Your Inbox' | translate }}</h2>
          <p>{{ 'WHOLESALER_BUSINESS_INFO.Verification email sent to' | translate }}</p>
          <div class="email-badge">
            <ion-icon name="mail-outline"></ion-icon>
            <span>{{ newEmailAddress }}</span>
          </div>
          <p class="hint-text">
            {{ 'WHOLESALER_BUSINESS_INFO.Click the link in the email to confirm your new address' | translate }}
          </p>
          <ion-button expand="block" (click)="closeModal()" class="primary-btn">
            <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
            {{ 'WHOLESALER_BUSINESS_INFO.Done' | translate }}
          </ion-button>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .modal-ion-content {
      --background: #f4f6fb;
    }

    .modal-wrapper {
      padding: 24px 16px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100%;
    }

    .step-card {
      background: #fff;
      border-radius: 20px;
      padding: 28px 24px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
    }

    .step-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .step-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #1a2035;
      margin: 0 0 8px;
    }

    .step-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .input-group {
      margin-bottom: 20px;
    }

    .input-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      padding-left: 2px;
    }

    .input-wrap {
      display: flex;
      align-items: center;
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 4px 12px;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: var(--ion-color-primary, #2f5aa8);
        background: #fff;
        box-shadow: 0 0 0 3px rgba(47, 90, 168, 0.1);
      }
    }

    .has-error .input-wrap {
      border-color: var(--ion-color-danger, #eb445a);
      background: #fff8f8;

      &:focus-within {
        box-shadow: 0 0 0 3px rgba(235, 68, 90, 0.1);
      }
    }

    .input-icon {
      font-size: 18px;
      color: #9ca3af;
      flex-shrink: 0;
      margin-right: 8px;
    }

    .custom-input {
      --padding-start: 0;
      --padding-end: 0;
      --background: transparent;
      font-size: 14px;
      color: #111827;
      flex: 1;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--ion-color-danger, #eb445a);
      font-size: 12px;
      margin-top: 6px;
      padding-left: 4px;

      ion-icon {
        font-size: 13px;
        flex-shrink: 0;
      }
    }

    .primary-btn {
      --border-radius: 12px;
      --padding-top: 14px;
      --padding-bottom: 14px;
      margin-top: 8px;
      font-weight: 600;
      font-size: 15px;
    }

    .back-btn {
      --border-radius: 12px;
      margin-top: 8px;
    }

    /* ── Sent confirmation ── */
    .success-card {
      text-align: center;
      padding: 40px 24px;
    }

    .success-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2f5aa8, #4a7fd4);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 8px 24px rgba(47, 90, 168, 0.35);
      font-size: 34px;
      color: #fff;
    }

    .success-card h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a2035;
      margin: 0 0 10px;
    }

    .success-card p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .hint-text {
      font-size: 13px;
      color: #9ca3af;
      margin: 0 0 28px !important;
      line-height: 1.5;
    }

    .email-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(47, 90, 168, 0.08);
      border: 1px solid rgba(47, 90, 168, 0.18);
      border-radius: 20px;
      padding: 6px 14px;
      margin: 12px 0 16px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-primary, #2f5aa8);

      ion-icon {
        font-size: 14px;
      }
    }
  `]
})
export class EmailVerificationModalComponent implements OnInit, OnDestroy {
  currentStep: 'email' | 'sent' = 'email';
  emailForm: FormGroup;
  newEmailAddress: string = '';
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private businessInfoService: BusinessInfoService
  ) {
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Request email change with user-friendly error handling
   */
  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const newEmail = this.emailForm.get('newEmail')?.value;
    this.newEmailAddress = newEmail;

    this.businessInfoService
      .requestEmailChange(newEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 'sent';
        },
        error: async (err) => {
          this.isLoading = false;
          const userMsg = this.getErrorMessage(err);
          await this.showToast(userMsg, 'danger');
        },
      });
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getErrorMessage(error: any): string {
    if (!error) return 'WHOLESALER_BUSINESS_INFO.UNKNOWN_ERROR';

    if (error.name === 'TimeoutError') {
      return 'WHOLESALER_BUSINESS_INFO.REQUEST_TIMEOUT';
    }
    if (error.status === 0) {
      return 'WHOLESALER_BUSINESS_INFO.NETWORK_ERROR';
    }
    if (error.status === 401) {
      return 'WHOLESALER_BUSINESS_INFO.SESSION_EXPIRED';
    }
    if (error.status === 409) {
      const detail = error?.error?.error ?? '';
      if (detail.includes('already')) {
        return 'WHOLESALER_BUSINESS_INFO.EMAIL_ALREADY_EXISTS';
      }
    }
    if (error.status >= 500) {
      return 'WHOLESALER_BUSINESS_INFO.SERVER_ERROR';
    }

    return error?.error?.error ?? 'WHOLESALER_BUSINESS_INFO.FAILED_TO_SEND_EMAIL';
  }

  /**
   * Close modal with optional success data
   * @param emailUpdated Whether email was successfully updated
   */
  closeModal(emailUpdated = false): void {
    this.modalCtrl.dismiss({ emailUpdated });
  }

  /**
   * Display toast notification with auto-translation
   */
  private async showToast(message: string, color: string, useTranslate = true) {
    const toast = await this.toastCtrl.create({
      message: useTranslate ? this.translate.instant(message) : message,
      duration: color === 'success' ? 2500 : 3500,
      color,
      position: 'bottom',
      buttons: [{
        text: this.translate.instant('COMMON.DISMISS'),
        role: 'cancel',
      }],
    });
    await toast.present();
  }
}