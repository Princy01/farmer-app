import { Component, OnInit } from '@angular/core';
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
  closeCircleOutline
} from 'ionicons/icons';
import { BusinessUpdateService, BusinessUpdateRequest } from './business-update.service';
import { AuthService } from '../../auth/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-business-update',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslateModule],
  templateUrl: './business-update.component.html',
  styleUrls: ['./business-update.component.scss'],
})
export class BusinessUpdateComponent implements OnInit {
  businessForm: FormGroup;
  isLoading = false;
  currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private businessUpdateService: BusinessUpdateService,
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private translate: TranslateService // <-- Inject TranslateService
  ) {
    addIcons({
      businessOutline,
      mailOutline,
      callOutline,
      locationOutline,
      saveOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });

    this.businessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      address: ['', Validators.required],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();

    // Check if user is authenticated and is a retailer
    if (!this.authService.isAuthenticated()) {
      this.presentToast(this.translate.instant('BUSINESS_UPDATE.ERROR_AUTH_REQUIRED'), 'danger');
      this.router.navigate(['/auth']);
      return;
    }

    if (!this.authService.hasRole('retailer')) {
      this.presentToast(this.translate.instant('BUSINESS_UPDATE.ERROR_ROLE_DENIED'), 'danger');
      this.router.navigate(['/auth']);
      return;
    }
  }

  async onUpdateBusiness() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.presentToast(this.translate.instant('BUSINESS_UPDATE.ERROR_FORM_INVALID'), 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.translate.instant('BUSINESS_UPDATE.LOADING_UPDATE'),
      spinner: 'crescent'
    });
    await loading.present();

    this.isLoading = true;

    const businessData: BusinessUpdateRequest = {
      email: this.businessForm.value.email,
      mobile_number: this.businessForm.value.mobile_number,
      address: this.businessForm.value.address,
      is_active: this.businessForm.value.is_active
    };

    this.businessUpdateService.updateBusiness(businessData).subscribe({
      next: (response) => {
        this.isLoading = false;
        loading.dismiss();
        this.presentToast(this.translate.instant('BUSINESS_UPDATE.SUCCESS_UPDATE'), 'success');

        // Navigate back to retailer home/dashboard
        setTimeout(() => {
          this.router.navigate(['/buyer/buyer-home']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        loading.dismiss();

        let errorMessage = this.translate.instant('BUSINESS_UPDATE.ERROR_UPDATE_FAILED');

        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 401) {
          errorMessage = this.translate.instant('BUSINESS_UPDATE.ERROR_SESSION_EXPIRED');
          this.authService.logout();
          this.router.navigate(['/auth']);
          return;
        } else if (error.status === 0) {
          errorMessage = this.translate.instant('BUSINESS_UPDATE.ERROR_NO_CONNECTION');
        }

        this.presentToast(errorMessage, 'danger');
      }
    });
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }

  // Helper methods for form validation
  getErrorMessage(fieldName: string): string {
    const field = this.businessForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.translate.instant(`BUSINESS_UPDATE.ERROR_REQUIRED_${fieldName.toUpperCase()}`);
      }
      if (field.errors['email']) {
        return this.translate.instant('BUSINESS_UPDATE.ERROR_INVALID_EMAIL');
      }
      if (field.errors['pattern']) {
        return this.translate.instant('BUSINESS_UPDATE.ERROR_INVALID_MOBILE');
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'email': this.translate.instant('BUSINESS_UPDATE.EMAIL_LABEL'),
      'mobile_number': this.translate.instant('BUSINESS_UPDATE.MOBILE_LABEL'),
      'address': this.translate.instant('BUSINESS_UPDATE.ADDRESS_LABEL')
    };
    return labels[fieldName] || fieldName.replace('_', ' ');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}