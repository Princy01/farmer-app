import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { State, City, Location, BusinessType, BusinessRegistrationService } from './business-registration.service';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss'],
})
export class BusinessRegistrationComponent implements OnInit {
  form: FormGroup;
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  businessTypes: BusinessType[] = [];

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private businessRegistrationService: BusinessRegistrationService
  ) {
    this.form = this.fb.group({
      bid: [null],
      b_registration_num: ['', Validators.required],
      b_owner_name: ['', Validators.required],
      b_category_id: [null, Validators.required],
      b_type_id: [null, Validators.required],
      is_active: [true],
      state_id: [null, Validators.required],
      city_id: [null, Validators.required],
      location_id: [null, Validators.required],
      address: ['', Validators.required],
      mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      established_year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      user_id: [null, Validators.required],
      gst_number: ['', Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)]],
      privileged_user: [false],
    });

    addIcons({ save });
  }

  ngOnInit() {
    this.fetchBusinessTypes();
    this.fetchStates();
    this.form.get('state_id')?.valueChanges.subscribe((stateId) => {
      if (stateId) {
        this.fetchCities(stateId);
      } else {
        this.cities = [];
        this.form.get('location_id')?.setValue(null);
        this.locations = [];
      }
    });
    this.form.get('location_id')?.valueChanges.subscribe((cityId) => {
      if (cityId) {
        this.fetchLocations(cityId);
      } else {
        this.locations = [];
        this.form.get('location_id')?.setValue(null);
      }
    });
  }

  fetchBusinessTypes() {
    this.businessRegistrationService.getBusinessTypes().subscribe({
      next: (data) => (this.businessTypes = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to load business types',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  fetchStates() {
    this.businessRegistrationService.getStates().subscribe({
      next: (data) => (this.states = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to load states',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  fetchCities(stateId: number) {
    this.businessRegistrationService.getCitiesOfState(stateId).subscribe({
      next: (data) => (this.cities = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to load cities',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  fetchLocations(cityId: number) {
    this.businessRegistrationService.getLocationsByCity(cityId).subscribe({
      next: (data) => (this.locations = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Failed to load locations',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
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