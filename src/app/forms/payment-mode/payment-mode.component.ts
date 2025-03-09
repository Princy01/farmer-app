import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PaymentModeService } from '../../services/payment-mode.service';

@Component({
  selector: 'app-payment-mode',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './payment-mode.component.html',
  styleUrls: ['./payment-mode.component.scss']
})
export class PaymentModeComponent {
  paymentModeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private paymentModeService: PaymentModeService,
    private navCtrl: NavController
  ) {
    this.paymentModeForm = this.fb.group({
      payment_mode: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.paymentModeForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.paymentModeForm.valid) {
      console.log('Form Submitted:', this.paymentModeForm.value);
      this.paymentModeService.createPaymentMode(this.paymentModeForm.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.paymentModeForm.reset();
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
