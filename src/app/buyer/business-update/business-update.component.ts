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

@Component({
  selector: 'app-business-update',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
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
      this.presentToast('Please login to access this page.', 'danger');
      this.router.navigate(['/auth']);
      return;
    }

    if (!this.authService.hasRole('retailer')) {
      this.presentToast('Access denied. Only retailers can access this page.', 'danger');
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
      message: 'Updating retailer business...',
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
        this.presentToast('Retailer business updated successfully!', 'success');

        // Navigate back to retailer home/dashboard
        setTimeout(() => {
          this.router.navigate(['/buyer/buyer-home']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        loading.dismiss();

        let errorMessage = 'Failed to update retailer business. Please try again.';

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
    // Navigate back to retailer home instead of wholesaler home
    this.router.navigate(['/buyer/buyer-home']);
  }

  // Helper methods for form validation
  getErrorMessage(fieldName: string): string {
    const field = this.businessForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid mobile number (10-15 digits)';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'email': 'Email',
      'mobile_number': 'Mobile number',
      'address': 'Address'
    };
    return labels[fieldName] || fieldName.replace('_', ' ');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.businessForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}