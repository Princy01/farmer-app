import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MandiService } from '../../services/mandi.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mandi',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './mandi.component.html',
  styleUrls: ['./mandi.component.scss']
})
export class MandiComponent {
  mandi: FormGroup;

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private mandiService: MandiService,
    private navCtrl: NavController,
    private route: ActivatedRoute
  ) {
    this.mandi = this.fb.group({
      mandi_location: ['', [Validators.required, Validators.maxLength(255)]],
      mandi_number: ['', [Validators.required, Validators.maxLength(50)]],
      mandi_incharge: ['', [Validators.required, Validators.maxLength(255)]],
      mandi_incharge_num: ['', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.maxLength(15)]],
      mandi_pincode: ['', [Validators.required, Validators.pattern("^[0-9]{6}$")]],
      mandi_address: [''], // Nullable field
      mandi_city: [null], // Foreign Key (nullable)
      mandi_state: [null], // Foreign Key (nullable)
      remarks: [''], // Nullable field
    });

    this.route.queryParams.subscribe(params => {
      if (params['mandi_city']) {
        this.mandi.patchValue({ mandi_city: params['mandi_city'] });
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.mandi.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.mandi.valid) {
      console.log('Form Submitted:', this.mandi.value);
      this.mandiService.createMandi(this.mandi.value).subscribe({
        next: data => {
          console.log('Mandi Created:', data);
          this.mandi.reset();
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

  // navigateToLocationForm() {
  //   this.navCtrl.navigateForward('/admin/location');
  // }

  // navigateToStateForm() {
  //   this.navCtrl.navigateForward('/admin/state');
  // }
}
