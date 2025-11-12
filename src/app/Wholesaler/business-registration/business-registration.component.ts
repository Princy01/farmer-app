import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { State, City, Location, BusinessType, BusinessCategory, BusinessRegistrationService } from './business-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
import { WholesalerApiService } from '../services/wholesaler-api.service';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-business-registration',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './business-registration.component.html',
  styleUrls: ['./business-registration.component.scss'],
})
export class BusinessRegistrationComponent implements OnInit {
  form: FormGroup;
  businessCategories: BusinessCategory[] = [];
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  businessTypes: BusinessType[] = [];

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private businessRegistrationService: BusinessRegistrationService,
    private authService: AuthService,
    private wholesalerApiService: WholesalerApiService,
    private router: Router,
    private translate: TranslateService
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
    // Check business existence first
    this.wholesalerApiService.getBusinessExistsOrNot().subscribe({
      next: (exists) => {
        if (exists) {
          // Business already exists, navigate to the home
          this.router.navigate(['/wholesaler/home']);
        } else {
          // Business does not exist, continue with registration initialization
          this.initializeRegistrationForm();
        }
      },
      error: (err) => {
        // Business does not exist, continue with registration
        this.initializeRegistrationForm();
      }
    });
  }

  private initializeRegistrationForm() {
    this.fetchBusinessCategories();
    this.fetchBusinessTypes();
    this.fetchStates();

    // Set user_id from AuthService
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    }

    this.form.get('state_id')?.valueChanges.subscribe((stateId) => {
      if (stateId) {
        this.fetchCities(stateId);
        this.form.get('city_id')?.setValue(null);
        this.locations = [];
        this.form.get('location_id')?.setValue(null);
      } else {
        this.cities = [];
        this.locations = [];
        this.form.get('city_id')?.setValue(null);
        this.form.get('location_id')?.setValue(null);
      }
    });

    this.form.get('city_id')?.valueChanges.subscribe((cityId) => {
      if (cityId) {
        this.fetchLocations(cityId);
        this.form.get('location_id')?.setValue(null);
      } else {
        this.locations = [];
        this.form.get('location_id')?.setValue(null);
      }
    });
  }

  fetchBusinessCategories() {
    this.businessRegistrationService.getBusinessCategories().subscribe({
      next: (data) => (this.businessCategories = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('BUSINESS_REGISTRATION.LOAD_CATEGORIES_ERROR'),
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  fetchBusinessTypes() {
    this.businessRegistrationService.getBusinessTypes().subscribe({
      next: (data) => (this.businessTypes = data),
      error: async () => {
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('BUSINESS_REGISTRATION.LOAD_TYPES_ERROR'),
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
          message: this.translate.instant('BUSINESS_REGISTRATION.LOAD_STATES_ERROR'),
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
          message: this.translate.instant('BUSINESS_REGISTRATION.LOAD_CITIES_ERROR'),
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
          message: this.translate.instant('BUSINESS_REGISTRATION.LOAD_LOCATIONS_ERROR'),
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      // Prepare payload as per Go struct
      const payload = {
        ...this.form.value,
        city_id: this.form.value.city_id
      };

      this.businessRegistrationService.addNewBusiness(payload).subscribe({
        next: async (res) => {
          const toast = await this.toastCtrl.create({
            message: this.translate.instant('BUSINESS_REGISTRATION.REGISTRATION_SUCCESS'),
            duration: 2000,
            color: 'success',
          });
          toast.present();
          this.form.reset();
        },
        error: async (err) => {
          const toast = await this.toastCtrl.create({
            message: err?.error?.error || this.translate.instant('BUSINESS_REGISTRATION.REGISTRATION_FAILED'),
            duration: 2000,
            color: 'danger',
          });
          toast.present();
        }
      });
    } else {
      this.form.markAllAsTouched();
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('BUSINESS_REGISTRATION.FIX_ERRORS'),
        duration: 2000,
        color: 'danger',
      });
      toast.present();
    }
  }
}