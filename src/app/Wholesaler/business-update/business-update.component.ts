import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  businessOutline,
  mailOutline,
  callOutline,
  locationOutline,
  saveOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  hourglassOutline,
  alertCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { BusinessUpdateService, BusinessUpdateRequest } from './business-update.service';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-business-update',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslatePipe],
  templateUrl: './business-update.component.html',
  styleUrls: ['./business-update.component.scss'],
})
export class BusinessUpdatePage implements OnInit, OnDestroy {
  businessForm!: FormGroup;
  isLoading = false;
  currentUserId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private businessUpdateService: BusinessUpdateService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({
      businessOutline,
      mailOutline,
      callOutline,
      locationOutline,
      saveOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      hourglassOutline,
      alertCircleOutline,
      informationCircleOutline
    });

    this.initializeForm();
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();

    // Check if user is a wholesaler
    if (!this.authService.hasRole('wholesaler')) {
      this.presentToast(this.translate.instant('WHOLESALER_BUSINESS_UPDATE.ACCESS_DENIED'), 'danger');
      this.router.navigate(['/auth']);
      return;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.businessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mobile_number: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10,15}$/),
        Validators.minLength(10),
        Validators.maxLength(15)
      ]],
      address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      is_active: [true]
    });
  }

  async onUpdateBusiness(): Promise<void> {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.presentToast(
        this.translate.instant('WHOLESALER_BUSINESS_UPDATE.FILL_REQUIRED_FIELDS'),
        'warning'
      );
      return;
    }

    if (this.isLoading) {
      return; // Prevent double submission
    }

    const loading = await this.loadingController.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATING'),
      spinner: 'crescent'
    });

    try {
      await loading.present();
      this.isLoading = true;

      const businessData: BusinessUpdateRequest = {
        email: this.businessForm.value.email.trim(),
        mobile_number: this.businessForm.value.mobile_number.trim(),
        address: this.businessForm.value.address.trim(),
        is_active: this.businessForm.value.is_active
      };

      this.businessUpdateService.updateBusiness(businessData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.handleSuccess(response.message);
          },
          error: (error) => {
            this.handleError(error);
          },
          complete: () => {
            this.isLoading = false;
            loading.dismiss();
          }
        });
    } catch (error) {
      this.isLoading = false;
      loading.dismiss();
      console.error('Unexpected error in onUpdateBusiness:', error);
      this.presentToast(
        this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UNEXPECTED_ERROR'),
        'danger'
      );
    }
  }

  private handleSuccess(message?: string): void {
    this.presentToast(
      message || this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATE_SUCCESS'),
      'success'
    );

    // Navigate back after a short delay
    setTimeout(() => {
      this.router.navigate(['/wholesaler/business-registration']);
    }, 1500);
  }

  private handleError(error: any): void {
    let errorMessage = this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATE_FAILED');

    if (error.message) {
      errorMessage = error.message;
    }

    // Handle session expiration
    if (error.status === 401) {
      errorMessage = this.translate.instant('WHOLESALER_BUSINESS_UPDATE.SESSION_EXPIRED');
      this.authService.logout();
      setTimeout(() => {
        this.router.navigate(['/auth']);
      }, 2000);
    }

    this.presentToast(errorMessage, 'danger');
  }

  async presentToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: this.translate.instant('COMMON.DISMISS'),
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  goBack(): void {
    if (this.businessForm.dirty) {
      // Optionally add confirmation dialog if form has unsaved changes
      this.router.navigate(['/wholesaler/home']);
    } else {
      this.router.navigate(['/wholesaler/home']);
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.businessForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;
    const fieldKey = this.getFieldTranslationKey(fieldName);

    if (errors['required']) {
      return this.translate.instant(`WHOLESALER_BUSINESS_UPDATE.${fieldKey}_REQUIRED`);
    }
    if (errors['email']) {
      return this.translate.instant('WHOLESALER_BUSINESS_UPDATE.INVALID_EMAIL');
    }
    if (errors['pattern']) {
      return this.translate.instant('WHOLESALER_BUSINESS_UPDATE.INVALID_MOBILE');
    }
    if (errors['minlength']) {
      return this.translate.instant(`WHOLESALER_BUSINESS_UPDATE.${fieldKey}_MIN_LENGTH`, {
        min: errors['minlength'].requiredLength
      });
    }
    if (errors['maxlength']) {
      return this.translate.instant(`WHOLESALER_BUSINESS_UPDATE.${fieldKey}_MAX_LENGTH`, {
        max: errors['maxlength'].requiredLength
      });
    }

    return this.translate.instant('WHOLESALER_BUSINESS_UPDATE.INVALID_FIELD');
  }

  private getFieldTranslationKey(fieldName: string): string {
    return fieldName.toUpperCase();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}