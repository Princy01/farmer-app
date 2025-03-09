import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BusinessTypeService } from '../../services/business-type.service';

@Component({
  selector: 'app-business-type',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './business-type.component.html',
  styleUrls: ['./business-type.component.scss']
})
export class BusinessTypeComponent {
  businessType: FormGroup;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private businessTypeService: BusinessTypeService,
    private navCtrl: NavController
  ) {
    this.businessType = this.fb.group({
      b_typename: ['', [Validators.required, Validators.maxLength(255)]],
      remarks: ['']
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.businessType.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.businessType.valid) {
      console.log('Form Submitted:', this.businessType.value);
      this.businessTypeService.createBusinessType(this.businessType.value).subscribe({
        next: (data) => {
          console.log('Data:', data);
          this.businessType.reset();
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
