import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
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
        <ion-title>{{ 'RETAILER_BUSINESS_INFO.Update Email' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()" color="medium">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="modal-content">
        <!-- Step 1: Enter New Email -->
        <div *ngIf="currentStep === 'email'" class="step">
          <h2>{{ 'RETAILER_BUSINESS_INFO.Enter New Email' | translate }}</h2>
          <form [formGroup]="emailForm" (ngSubmit)="requestEmailChange()">
            <ion-item>
              <ion-label position="stacked">{{ 'RETAILER_BUSINESS_INFO.New Email Address' | translate }}</ion-label>
              <ion-input formControlName="newEmail" type="email" placeholder="name@example.com" inputmode="email"></ion-input>
            </ion-item>
            <div class="error-message" *ngIf="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched">
              <span *ngIf="emailForm.get('newEmail')?.errors?.['required']">
                {{ 'RETAILER_BUSINESS_INFO.Email is required' | translate }}
              </span>
              <span *ngIf="emailForm.get('newEmail')?.errors?.['email']">
                {{ 'RETAILER_BUSINESS_INFO.Please enter a valid email address' | translate }}
              </span>
            </div>
            <ion-button expand="block" type="submit" [disabled]="emailForm.invalid || isLoading">
              <span *ngIf="!isLoading">{{ 'RETAILER_BUSINESS_INFO.Send Verification' | translate }}</span>
              <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            </ion-button>
          </form>
        </div>

        <!-- Step 2: Verify with Token -->
        <div *ngIf="currentStep === 'token'" class="step">
          <h2>{{ 'RETAILER_BUSINESS_INFO.Verify Email' | translate }}</h2>
          <p class="info-text">{{ 'RETAILER_BUSINESS_INFO.Verification email sent to' | translate }}: <strong>{{ newEmailAddress }}</strong></p>
          <form [formGroup]="tokenForm" (ngSubmit)="verifyEmail()">
            <ion-item>
              <ion-label position="stacked">{{ 'RETAILER_BUSINESS_INFO.Verification Token' | translate }}</ion-label>
              <ion-input formControlName="token" placeholder="000000" inputmode="numeric" autocomplete="off"></ion-input>
            </ion-item>
            <div class="error-message" *ngIf="tokenForm.get('token')?.invalid && tokenForm.get('token')?.touched">
              <span *ngIf="tokenForm.get('token')?.errors?.['required']">
                {{ 'RETAILER_BUSINESS_INFO.Token is required' | translate }}
              </span>
            </div>
            <ion-button expand="block" type="submit" [disabled]="tokenForm.invalid || isLoading">
              <span *ngIf="!isLoading">{{ 'RETAILER_BUSINESS_INFO.Verify' | translate }}</span>
              <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="backToEmail()">
              {{ 'RETAILER_BUSINESS_INFO.Back' | translate }}
            </ion-button>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div *ngIf="currentStep === 'success'" class="step success-step">
          <ion-icon name="checkmark-circle" color="success"></ion-icon>
          <h2>{{ 'RETAILER_BUSINESS_INFO.Email Updated' | translate }}</h2>
          <p>{{ 'RETAILER_BUSINESS_INFO.Your email has been successfully updated' | translate }}</p>
          <ion-button expand="block" (click)="closeModal()">
            {{ 'RETAILER_BUSINESS_INFO.Done' | translate }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .modal-content {
      padding: 20px;
    }

    .step {
      margin-bottom: 20px;
    }

    .step h2 {
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    ion-item {
      --background: #f9fafb;
      --border-radius: 8px;
      border-radius: 8px;
      margin-bottom: 0;
      --padding-start: 12px;
      --padding-end: 12px;

      ion-label {
        font-weight: 600;
        font-size: 0.875rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      ion-input {
        --padding-top: 12px;
        --padding-bottom: 12px;
        font-size: 1rem;
        color: #1f2937;
      }
    }

    .info-text {
      margin: 15px 0;
      color: #4b5563;
      font-size: 14px;
      padding: 12px;
      background: #e0e7ff;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }

    .error-message {
      color: #ef4444;
      font-size: 12px;
      margin: -12px 0 8px 0;
      padding: 0 8px;
      display: flex;
      align-items: center;
      animation: fadeIn 0.2s ease;
    }

    .error-message::before {
      content: '⚠';
      margin-right: 6px;
      font-size: 1rem;
    }

    ion-button {
      margin-top: 8px;
      --border-radius: 8px;
      height: 48px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &[type="submit"] {
        --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }

      &[fill="outline"] {
        --border-color: #d1d5db;
        --color: #6b7280;
      }

      &[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .success-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .success-step ion-icon {
      font-size: 80px;
      margin-bottom: 20px;
      color: #10b981;
    }

    .success-step h2 {
      margin: 20px 0 10px 0;
      color: #10b981;
    }

    .success-step p {
      color: #4b5563;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    ion-spinner {
      margin-left: 10px;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class EmailVerificationModalComponent implements OnDestroy {
  currentStep: 'email' | 'token' | 'success' = 'email';
  emailForm: FormGroup;
  tokenForm: FormGroup;
  newEmailAddress: string = '';
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private businessInfoService: BusinessInfoService
  ) {
    this.emailForm = this.fb.group({
      newEmail: ['', [Validators.required, Validators.email]],
    });

    this.tokenForm = this.fb.group({
      token: ['', [Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  requestEmailChange(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) {
      return; // Prevent double-submit
    }

    this.isLoading = true;
    const newEmail = this.emailForm.get('newEmail')?.value;
    this.newEmailAddress = newEmail;

    this.businessInfoService
      .requestEmailChange(newEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (!res?.message) {
            this.showToast('RETAILER_BUSINESS_INFO.FAILED_TO_SEND_EMAIL', 'danger');
            return;
          }
          this.currentStep = 'token';
        },
        error: (err) => {
          this.isLoading = false;
          const serverMsg: string = err?.error?.error ?? '';
          let toastMsg = 'RETAILER_BUSINESS_INFO.FAILED_TO_SEND_EMAIL';

          if (serverMsg.includes('already exists')) {
            toastMsg = 'RETAILER_BUSINESS_INFO.EMAIL_ALREADY_EXISTS';
          } else if (serverMsg.includes('invalid')) {
            toastMsg = 'RETAILER_BUSINESS_INFO.INVALID_EMAIL_FORMAT';
          }

          this.showToast(toastMsg, 'danger');
        },
      });
  }

  verifyEmail(): void {
    if (this.tokenForm.invalid) {
      this.tokenForm.markAllAsTouched();
      return;
    }

    if (this.isLoading) {
      return; // Prevent double-submit
    }

    this.isLoading = true;
    const token = this.tokenForm.get('token')?.value;

    this.businessInfoService
      .verifyEmailChange(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (!res?.verified) {
            this.showToast('RETAILER_BUSINESS_INFO.INVALID_TOKEN', 'danger');
            return;
          }
          this.currentStep = 'success';
        },
        error: (err) => {
          this.isLoading = false;
          const serverMsg: string = err?.error?.error ?? '';
          let toastMsg = 'RETAILER_BUSINESS_INFO.INVALID_TOKEN';

          if (serverMsg.includes('expired')) {
            toastMsg = 'RETAILER_BUSINESS_INFO.TOKEN_EXPIRED';
          } else if (serverMsg.includes('already')) {
            toastMsg = 'RETAILER_BUSINESS_INFO.EMAIL_ALREADY_VERIFIED';
          }

          this.showToast(toastMsg, 'danger');
        },
      });
  }

  backToEmail(): void {
    this.currentStep = 'email';
    this.emailForm.reset();
  }

  closeModal(): void {
    if (this.currentStep === 'success') {
      this.modalCtrl.dismiss({ emailUpdated: true });
    } else {
      this.modalCtrl.dismiss();
    }
  }

  private showToast(message: string, color: string) {
    this.toastCtrl.create({
      message: this.translate.instant(message),
      duration: 2500,
      color,
      position: 'bottom',
    }).then(toast => toast.present());
  }
}
