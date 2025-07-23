import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack } from 'ionicons/icons';
import { BusinessLocationsService, BusinessLocation } from '../services/business-locations.service';

@Component({
  selector: 'app-add-business-location',
  templateUrl: './add-business-location.component.html',
  styleUrls: ['./add-business-location.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class AddBusinessLocationComponent implements OnInit {
  businessForm: FormGroup;
  isEditMode = false;
  locationId: number | null = null;
  pageTitle = 'Add Business Location';

  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal'
  ];

  // Field labels mapping for better error messages
  fieldLabels: { [key: string]: string } = {
    shopName: 'Shop Name',
    number: 'Phone Number',
    location: 'Location',
    state: 'State',
    address: 'Address',
    email: 'Email',
    gstNumber: 'GST Number',
    pan: 'PAN Number',
    pincode: 'Pincode',
    privilegedUser: 'Privileged User',
    typeId: 'Business Type',
    establishedYear: 'Established Year'
  };

  constructor(
    private formBuilder: FormBuilder,
    private businessService: BusinessLocationsService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ save, arrowBack });

    this.businessForm = this.formBuilder.group({
      shopName: ['', Validators.required],
      number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      location: ['', Validators.required],
      state: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gstNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
      pan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      privilegedUser: ['', Validators.required],
      active_status: [1],
      typeId: ['wholesale'],
      establishedYear: ['', [Validators.pattern(/^[0-9]{4}$/)]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'edit' && params['locationId']) {
        this.isEditMode = true;
        this.locationId = +params['locationId'];
        this.pageTitle = 'Edit Business Location';
        this.loadLocationData();
      }
    });
  }

  loadLocationData() {
    this.businessService.getAllBusinessesOfWholesaler('1').subscribe((locations: BusinessLocation[]) => {
      const location = locations.find((l: BusinessLocation) => l.id === this.locationId);
      if (location) {
        this.businessForm.patchValue(location);
      }
    });
  }

  async onSubmit() {
    if (this.businessForm.valid) {
      const loading = await this.loadingController.create({
        message: this.isEditMode ? 'Updating location...' : 'Creating location...'
      });
      await loading.present();

      try {
        const formData = this.businessForm.value;
        const userId = '1';

        if (this.isEditMode && this.locationId) {
          formData.id = this.locationId;
          this.businessService.modifyBusinessesOfWholesaler(userId, formData).subscribe({
            next: async () => {
              loading.dismiss();
              await this.showToast('Business location updated successfully!', 'success');
              this.router.navigate(['/wholesaler/business-locations']);
            },
            error: async (error: any) => {
              loading.dismiss();
              await this.showToast('Error updating location. Please try again.', 'danger');
            }
          });
        } else {
          this.businessService.createBusinessesOfWholesaler(userId, formData).subscribe({
            next: async () => {
              loading.dismiss();
              await this.showToast('Business location created successfully!', 'success');
              this.router.navigate(['/wholesaler/business-locations']);
            },
            error: async (error: any) => {
              loading.dismiss();
              await this.showToast('Error creating location. Please try again.', 'danger');
            }
          });
        }
      } catch (error) {
        loading.dismiss();
        await this.showToast('An unexpected error occurred.', 'danger');
      }
    } else {
      await this.showToast('Please fill in all required fields correctly.', 'warning');
      this.markFormGroupTouched();
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  markFormGroupTouched() {
    Object.keys(this.businessForm.controls).forEach(key => {
      this.businessForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.businessForm.get(fieldName);
    const fieldLabel = this.fieldLabels[fieldName] || fieldName;

    if (control?.errors && control?.touched) {
      if (control.errors['required']) {
        return `${fieldLabel} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['pattern']) {
        switch (fieldName) {
          case 'number':
            return 'Please enter a valid 10-digit phone number';
          case 'gstNumber':
            return 'Please enter a valid GST number';
          case 'pan':
            return 'Please enter a valid PAN number';
          case 'pincode':
            return 'Please enter a valid 6-digit pincode';
          case 'establishedYear':
            return 'Please enter a valid year';
          default:
            return 'Please enter a valid value';
        }
      }
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/wholesaler/business-locations']);
  }
}