import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastController, IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transport-update-rates',
  standalone: true,
  templateUrl: './transport-update-rates.component.html',
  styleUrls: ['./transport-update-rates.component.scss'],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class TransportUpdateRatesComponent {
  rateForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    this.rateForm = this.fb.group({
      perKmRate: ['', [Validators.required, Validators.min(1)]],
      perKgRate: ['', [Validators.required, Validators.min(1)]],
      peakHourRate: ['', [Validators.required, Validators.min(1)]],
      isAvailable: [true], // Transporter availability toggle
      fleetCapacity: ['', [Validators.required, Validators.min(50)]],
      serviceAreas: [''], // Optional
    });
  }

  async updateRates() {
    if (this.rateForm.invalid) {
      this.showToast('Please fill all required fields correctly.', 'danger');
      return;
    }

    this.isSubmitting = true;
    const formData = this.rateForm.value;

    this.http.post('http://127.0.0.1:3000/api/transport/rates', formData).subscribe({
      next: async () => {
        this.isSubmitting = false;
        this.showToast('Transport rates updated successfully!', 'success');
      },
      error: async () => {
        this.isSubmitting = false;
        this.showToast('Failed to update rates. Try again.', 'danger');
      },
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    toast.present();
  }
}
