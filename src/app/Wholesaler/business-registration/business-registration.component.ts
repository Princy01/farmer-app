import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss'],
})
export class BusinessRegistrationComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder, private toastCtrl: ToastController) {
    this.form = this.fb.group({
      bid: [null],
      b_registration_num: ['', Validators.required],
      b_owner_name: ['', Validators.required],
      b_category_id: [null, Validators.required],
      b_type_id: [null, Validators.required],
      is_active: [true],
      state_id: [null, Validators.required],
      location_id: [null, Validators.required],
      address: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      established_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      user_id: [null, Validators.required],
      gst_number: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)]],
      privileged_user: [0],
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
      const toast = await this.toastCtrl.create({
        message: 'Form submitted successfully!',
        duration: 2000,
        color: 'success',
      });
      toast.present();
    } else {
      this.form.markAllAsTouched();
      const toast = await this.toastCtrl.create({
        message: 'Please fix the errors in the form.',
        duration: 2000,
        color: 'danger',
      });
      toast.present();
    }
  }
}
