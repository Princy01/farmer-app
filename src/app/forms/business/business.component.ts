import { Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BusinessService } from '../../services/business.service';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './business.component.html',
  styleUrls: ['./business.component.scss']
})
export class BusinessComponent {
  business: FormGroup;
  mandis: any[] = [];
  states: any[] = [];
  locations: any[] = [];
  businessTypes: any[] = [];
  businesses: any[] = [];

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private businessService: BusinessService,
    private navCtrl: NavController
  ) {
    this.business = this.fb.group({
      b_typeid: ['', Validators.required],
      b_name: ['', Validators.required],
      b_location_id: ['', Validators.required],
      b_state_id: ['', Validators.required],
      b_mandiid: [''],
      b_address: ['', Validators.required],
      b_phone_num: [''],
      b_email: ['', [Validators.required, Validators.email]],
      b_gstnum: ['', [Validators.required, Validators.maxLength(20)]],
      b_pannum: ['', [Validators.required, Validators.maxLength(10)]]
    });

    this.loadDropdownData();
    this.loadBusinesses();
  }

  loadBusinesses() {
    this.businessService.getBusinesses().subscribe({
      next: (data) => (this.businesses = data),
      error: (err) => console.error('Error fetching businesses:', err)
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.business.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.business.valid) {
      this.businessService.insertBusiness(this.business.value).subscribe({
        next: () => {
          console.log('Business added successfully');
          this.business.reset();
          this.loadBusinesses();
        },
        error: (error) => console.error('Error:', error)
      });
    } else {
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }

  updateBusiness(business: any) {
    this.businessService.updateBusiness(business).subscribe({
      next: () => {
        console.log('Business updated successfully');
        this.loadBusinesses();
      },
      error: (error) => console.error('Error:', error)
    });
  }

  // deleteBusiness(businessId: number) {
  //   this.businessService.deleteBusiness(businessId).subscribe({
  //     next: () => {
  //       console.log('Business deleted successfully');
  //       this.loadBusinesses();
  //     },
  //     error: (error) => console.error('Error:', error)
  //   });
  // }


  loadDropdownData() {
    this.businessService.getBusinessTypes().subscribe(data => this.businessTypes = data);
    this.businessService.getLocations().subscribe(data => this.locations = data);
    this.businessService.getStates().subscribe(data => this.states = data);
    this.businessService.getMandis().subscribe(data => this.mandis = data);
  }
}
