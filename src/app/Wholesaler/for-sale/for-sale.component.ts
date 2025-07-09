import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  leafOutline, starOutline, warningOutline, cubeOutline,
  cashOutline, calendarOutline, locationOutline,
  addCircleOutline, homeOutline, scaleOutline, refreshOutline  // Add scaleOutline
} from 'ionicons/icons';
import { WholesalerApiService, WholesellerEntry } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-screen3',
  templateUrl: './for-sale.component.html',
  styleUrls: ['./for-sale.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class ForSaleComponent implements OnInit {
  orderForm!: FormGroup;
  isSubmitting = false;
  qualities = ['A', 'B', 'C'];
  wastages = ['0%', '2%', '5%', '10%'];

  products: { product_id: number, product_name: string }[] = [];
  mandis: { mandi_id: number, mandi_name: string }[] = [];
  warehouses: { warehouse_id: number, warehouse_name: string }[] = [];
  units: { unit_id: number, unit_name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private wholesalerService: WholesalerApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({
  leafOutline, starOutline, warningOutline, cubeOutline,
  cashOutline, calendarOutline, locationOutline,
  addCircleOutline, homeOutline, scaleOutline, refreshOutline  // Add scaleOutline
});
  }

  ngOnInit() {
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.initForm();
    this.loadDropdownData();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private initForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    this.orderForm = this.fb.group({
      product_id: ['', Validators.required],
      quality: ['', Validators.required],
      wastage: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      datetime: ['', Validators.required],
      mandi_id: ['', Validators.required],
      warehouse_id: ['', Validators.required],
      unit_id: [2, Validators.required], // Default to KG
      wholeseller_id: [this.authService.getUserId(), Validators.required]
    });

    // Set default datetime to current time
    const now = new Date();
    const isoString = now.toISOString().slice(0, 16); // Format for datetime-local input
    this.orderForm.patchValue({
      datetime: isoString
    });
  }

  async createOrder() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (this.orderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const loading = await this.loadingCtrl.create({
        message: 'Creating order...',
        spinner: 'circular'
      });

      try {
        await loading.present();

        const formData = this.orderForm.value;
        const entry: WholesellerEntry = {
          ...formData,
          // Convert all IDs to integers
          product_id: parseInt(formData.product_id, 10),
          mandi_id: parseInt(formData.mandi_id, 10),
          warehouse_id: parseInt(formData.warehouse_id, 10),
          unit_id: parseInt(formData.unit_id, 10),
          // wholeseller_id will be set by service from JWT
          // Keep other conversions
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          datetime: new Date(formData.datetime).toISOString()
        };

        const response = await this.wholesalerService.createWholesellerEntry(entry).toPromise();

        await this.showToast('Order created successfully!', 'success');
        this.resetForm();
      } catch (error: any) {
        console.error('Failed to create order:', error);

        // Handle authentication errors
        if (error.status === 401) {
          this.showAuthError();
          return;
        }

        await this.showToast('Failed to create order. Please try again.', 'danger');
      } finally {
        await loading.dismiss();
        this.isSubmitting = false;
      }
    } else {
      await this.showToast('Please fill all required fields correctly.', 'warning');
      this.markFormGroupTouched();
    }
  }

  private resetForm() {
    this.orderForm.reset();
    // Reset to default values
    this.orderForm.patchValue({
      unit_id: 2,
      wholeseller_id: this.authService.getUserId(),
      datetime: new Date().toISOString().slice(0, 16)
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.orderForm.controls).forEach(key => {
      const control = this.orderForm.get(key);
      control?.markAsTouched();
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  // Validation helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.orderForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.orderForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.replace('_', ' ')} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName.replace('_', ' ')} must be greater than ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }

  async confirmReset() {
    const alert = await this.alertCtrl.create({
      header: 'Reset Form',
      message: 'Are you sure you want to reset all fields?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: () => {
            this.resetForm();
            this.showToast('Form has been reset', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  private async loadDropdownData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Loading form data...',
      spinner: 'circular'
    });

    try {
      await loading.present();

      // Load all dropdown data - service will use JWT token
      const [products, mandis, warehouses, units] = await Promise.all([
        this.wholesalerService.getProducts().toPromise(),
        this.wholesalerService.getMandis().toPromise(),
        this.wholesalerService.getWarehouses().toPromise(),
        this.wholesalerService.getUnits().toPromise()
      ]);

      this.products = products || [];
      this.mandis = mandis || [];
      this.warehouses = warehouses || [];
      this.units = units || [];

    } catch (error: any) {
      console.error('Failed to load dropdown data:', error);

      // Handle authentication errors
      if (error.status === 401) {
        this.showAuthError();
        return;
      }

      await this.showToast('Failed to load form data. Please try again.', 'danger');
    } finally {
      await loading.dismiss();
    }
  }
}