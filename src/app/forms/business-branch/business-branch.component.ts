import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BusinessBranchService } from '../../services/business-branch.service';

@Component({
  selector: 'app-business-branch',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './business-branch.component.html',
  styleUrls: ['./business-branch.component.scss']
})
export class BusinessBranchComponent {
  businessBranch: FormGroup;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private businessBranchService: BusinessBranchService,
    private navCtrl: NavController
  ) {
    this.businessBranch = this.fb.group({
      branch_id: [''],
      bid: ['', Validators.required],
      shop_name: ['', [Validators.required, Validators.maxLength(255)]],
      type_id: ['', Validators.required],
      location: ['', Validators.required],
      state: ['', Validators.required],
      mandi_id: ['', Validators.required],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      email: ['', [Validators.required, Validators.email]],
      number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],  // 10 digits mobile number
      gst_num: ['', [Validators.required, Validators.maxLength(15)]],
      pan_num: ['', [Validators.required, Validators.maxLength(10)]],
      privilege_user: ['', Validators.required],
      established_year: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]], // 4-digit year
      active_status: ['', Validators.required]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.businessBranch.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.businessBranch.valid) {
      console.log('Business Branch Data:', this.businessBranch.value);
      this.businessBranchService.insertBusinessBranch(this.businessBranch.value).subscribe({
        next: data => {
          console.log('Data:', data);
          this.businessBranch.reset();
          this.navCtrl.navigateBack('/business-branches');
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
