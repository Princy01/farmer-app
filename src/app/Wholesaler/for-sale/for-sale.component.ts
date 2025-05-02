import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { leafOutline, starOutline, warningOutline, cubeOutline,
         cashOutline, calendarOutline, locationOutline,
          addCircleOutline, homeOutline } from 'ionicons/icons';
import { WholesalerApiService, WholesellerEntry } from '../services/wholesaler-api.service';

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

  constructor(
    private fb: FormBuilder,
    private wholesalerService: WholesalerApiService,
    private toastCtrl: ToastController
  ) {
    addIcons({
      leafOutline, starOutline, warningOutline, cubeOutline,
      cashOutline, calendarOutline, locationOutline,
       addCircleOutline, homeOutline
    });
    this.initForm();
  }

  private initForm(): void {
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
      wholeseller_id: [3, Validators.required] // TODO: Get from auth service
    });
  }

  ngOnInit() { }

  async createOrder() {
    if (this.orderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData = this.orderForm.value;
        const entry: WholesellerEntry = {
          ...formData,
          datetime: new Date(formData.datetime).toISOString()
        };

        const response = await this.wholesalerService.createWholesellerEntry(entry).toPromise();

        await this.showToast('Order created successfully!', 'success');
        this.orderForm.reset();
      } catch (error) {
        console.error('Failed to create order:', error);
        await this.showToast('Failed to create order. Please try again.', 'danger');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      await this.showToast('Please fill all required fields correctly.', 'warning');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}