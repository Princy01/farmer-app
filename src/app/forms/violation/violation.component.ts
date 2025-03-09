import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ViolationService } from '../../services/violation.service';

@Component({
  selector: 'app-violation',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './violation.component.html',
  styleUrls: ['./violation.component.scss']
})
export class ViolationComponent {
  violation: FormGroup;

  constructor(private fb: FormBuilder, private el: ElementRef, private violationService: ViolationService, private navCtrl: NavController) {
    this.violation = this.fb.group({
      violation_name: ['', [Validators.required, Validators.maxLength(255)]],
      level_of_serious: ['', [Validators.required, Validators.maxLength(255)]],
      status: [1, Validators.required]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.violation.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.violation.valid) {
      console.log('Form Submitted:', this.violation.value);
      this.violationService.createViolation(this.violation.value).subscribe({
        next: data => {
          console.log('Data:', data);
          this.violation.reset();

          this.navCtrl.navigateBack('/admin/driver', {
            queryParams: { vehicle_id: data.vehicle_id }
          });
        },
        error: error => {
          console.error('Error:', error);
        }
      });
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
