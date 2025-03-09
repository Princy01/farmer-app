import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CashPaymentService } from '../../services/cash-payment.service';

@Component({
  selector: 'app-cash-payment',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './cash-payment.component.html',
  styleUrls: ['./cash-payment.component.scss']
})
export class CashPaymentComponent {
  cashPayment: FormGroup;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private cashPaymentService: CashPaymentService,
    private navCtrl: NavController
  ) {
    this.cashPayment = this.fb.group({
      payment_type: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.cashPayment.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.cashPayment.valid) {
      console.log('Form Submitted:', this.cashPayment.value);
      this.cashPaymentService.createPayment(this.cashPayment.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.cashPayment.reset();
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
