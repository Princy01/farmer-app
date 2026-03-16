import { Component, OnInit, OnDestroy } from '@angular/core';
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
        <ion-title>{{ 'WHOLESALER_BUSINESS_INFO.Update Email' | translate }}</ion-title>
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
          <h2>{{ 'WHOLESALER_BUSINESS_INFO.Enter New Email' | translate }}</h2>
          <form [formGroup]="emailForm" (ngSubmit)="requestEmailChange()">
            <ion-item>
              <ion-label position="stacked">{{ 'WHOLESALER_BUSINESS_INFO.New Email Address' | translate }}</ion-label>
              <ion-input formControlName="newEmail" type="email" placeholder="Enter new email"></ion-input>
            </ion-item>
            <div class="error-message" *ngIf="emailForm.get('newEmail')?.invalid && emailForm.get('newEmail')?.touched">
              <span *ngIf="emailForm.get('newEmail')?.errors?.['required']">
                {{ 'WHOLESALER_BUSINESS_INFO.Email is required' | translate }}
              </span>
              <span *ngIf="emailForm.get('newEmail')?.errors?.['email']">
                {{ 'WHOLESALER_BUSINESS_INFO.Please enter a valid email' | translate }}
              </span>
            </div>
            <ion-button expand="block" type="submit" [disabled]="emailForm.invalid || isLoading">
              <span *ngIf="!isLoading">{{ 'WHOLESALER_BUSINESS_INFO.Send Verification' | translate }}</span>
              <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            </ion-button>
          </form>
        </div>

        <!-- Step 2: Verify with Token -->
        <div *ngIf="currentStep === 'token'" class="step">
          <h2>{{ 'WHOLESALER_BUSINESS_INFO.Verify Email' | translate }}</h2>
          <p class="info-text">{{ 'WHOLESALER_BUSINESS_INFO.Verification email sent to' | translate }}: <strong>{{ newEmailAddress }}</strong></p>
          <form [formGroup]="tokenForm" (ngSubmit)="verifyEmail()">
            <ion-item>
              <ion-label position="stacked">{{ 'WHOLESALER_BUSINESS_INFO.Verification Token' | translate }}</ion-label>
              <ion-input formControlName="token" placeholder="Paste token from email" readonly="false"></ion-input>
            </ion-item>
            <div class="error-message" *ngIf="tokenForm.get('token')?.invalid && tokenForm.get('token')?.touched">
              <span *ngIf="tokenForm.get('token')?.errors?.['required']">
                {{ 'WHOLESALER_BUSINESS_INFO.Token is required' | translate }}
              </span>
            </div>
            <ion-button expand="block" type="submit" [disabled]="tokenForm.invalid || isLoading">
              <span *ngIf="!isLoading">{{ 'WHOLESALER_BUSINESS_INFO.Verify' | translate }}</span>
              <ion-spinner *ngIf="isLoading" name="crescent"></ion-spinner>
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="backToEmail()">
              {{ 'WHOLESALER_BUSINESS_INFO.Back' | translate }}
            </ion-button>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div *ngIf="currentStep === 'success'" class="step success-step">
          <ion-icon name="checkmark-circle" color="success"></ion-icon>
          <h2>{{ 'WHOLESALER_BUSINESS_INFO.Email Updated' | translate }}</h2>
          <p>{{ 'WHOLESALER_BUSINESS_INFO.Your email has been successfully updated' | translate }}</p>
          <ion-button expand="block" (click)="closeModal()">
            {{ 'WHOLESALER_BUSINESS_INFO.Done' | translate }}
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
    }

    .info-text {
      margin: 15px 0;
      color: #666;
      font-size: 14px;
    }

    .error-message {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 5px;
      padding: 0 5px;
    }

    ion-button {
      margin-top: 20px;
    }

    .success-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 0;
      text-align: center;
    }

    .success-step ion-icon {
      font-size: 60px;
      margin-bottom: 15px;
    }

    .success-step h2 {
      margin: 15px 0;
    }

    ion-spinner {
      margin-left: 10px;
    }
  `]
})
export class EmailVerificationModalComponent implements OnInit, OnDestroy {
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

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
          this.currentStep = 'token';
        },
        error: async (err) => {
          this.isLoading = false;
          const msg = err?.error?.error ?? 'WHOLESALER_BUSINESS_INFO.FAILED_TO_SEND_EMAIL';
          await this.showToast(msg, 'danger', false);
        },
      });
  }

  verifyEmail(): void {
    if (this.tokenForm.invalid) {
      this.tokenForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const token = this.tokenForm.get('token')?.value;

    this.businessInfoService
      .verifyEmailChange(token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 'success';
        },
        error: async (err) => {
          this.isLoading = false;
          const msg = err?.error?.error ?? 'WHOLESALER_BUSINESS_INFO.INVALID_TOKEN';
          await this.showToast(msg, 'danger', false);
        },
      });
  }

  backToEmail(): void {
    this.currentStep = 'email';
    this.emailForm.reset();
  }

  closeModal(): void {
    this.modalCtrl.dismiss();
  }

  private async showToast(message: string, color: string, useTranslate = true) {
    const toast = await this.toastCtrl.create({
      message: useTranslate ? this.translate.instant(message) : message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
