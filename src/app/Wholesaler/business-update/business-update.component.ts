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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-business-update',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslatePipe],
  templateUrl: './business-update.component.html',
  styleUrls: ['./business-update.component.scss'],
})
export class BusinessUpdatePage implements OnInit {
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
      closeCircleOutline
    });

    // Remove bid from form since it shouldn't be user-editable
    this.businessForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mobile_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      address: ['', Validators.required],
      is_active: [true]
    });
  }

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();

    // Check if user is a wholesaler
    if (!this.authService.hasRole('wholesaler')) {
      this.presentToast(this.translate.instant('WHOLESALER_BUSINESS_UPDATE.ACCESS_DENIED'), 'danger');
      this.router.navigate(['/auth']);
      return;
    }
  }

  async onUpdateBusiness() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.presentToast(this.translate.instant('WHOLESALER_BUSINESS_UPDATE.FILL_REQUIRED_FIELDS'), 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATING'),
      spinner: 'crescent'
    });
    await loading.present();

    this.isLoading = true;

    // Only send updatable fields - bid and user_id will be handled by backend
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
        this.presentToast(this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATE_SUCCESS'), 'success');

        // Navigate back to wholesaler dashboard or previous page
        setTimeout(() => {
          this.router.navigate(['/wholesaler/business-registration']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        loading.dismiss();

        let errorMessage = this.translate.instant('WHOLESALER_BUSINESS_UPDATE.UPDATE_FAILED');

        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 401) {
          errorMessage = this.translate.instant('WHOLESALER_BUSINESS_UPDATE.SESSION_EXPIRED');
          this.authService.logout();
          this.router.navigate(['/auth']);
          return;
        } else if (error.status === 0) {
          errorMessage = this.translate.instant('WHOLESALER_BUSINESS_UPDATE.CONNECTION_ERROR');
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
    this.router.navigate(['/wholesaler/home']);
  }

  // Helper methods for form validation
  getErrorMessage(fieldName: string): string {
    const field = this.businessForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.translate.instant(`WHOLESALER_BUSINESS_UPDATE.${this.getFieldKey(fieldName)}_REQUIRED`);
      }
      if (field.errors['email']) {
        return this.translate.instant('WHOLESALER_BUSINESS_UPDATE.INVALID_EMAIL');
      }
      if (field.errors['pattern']) {
        return this.translate.instant('WHOLESALER_BUSINESS_UPDATE.INVALID_MOBILE');
      }
    }
    return '';
  }

  // Helper to convert field names to translation key format
  private getFieldKey(fieldName: string): string {
    // Convert mobile_number to MOBILE_NUMBER, email to EMAIL, etc.
    return fieldName.toUpperCase();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}