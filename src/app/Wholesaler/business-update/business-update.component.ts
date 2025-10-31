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
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-business-update',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslatePipe, TranslateDirective],
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
    private router: Router
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
      this.presentToast('Access denied. Only wholesalers can access this page.', 'danger');
      this.router.navigate(['/auth']);
      return;
    }
  }

  async onUpdateBusiness() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      this.presentToast('Please fill in all required fields correctly', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Updating business...',
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
        this.presentToast('Business updated successfully!', 'success');

        // Navigate back to wholesaler dashboard or previous page
        setTimeout(() => {
          this.router.navigate(['/wholesaler/business-registration']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        loading.dismiss();

        let errorMessage = 'Failed to update business. Please try again.';

        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          this.authService.logout();
          this.router.navigate(['/auth']);
          return;
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
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
        return `${fieldName.replace('_', ' ')} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid mobile number';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}