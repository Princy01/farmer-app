import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save } from 'ionicons/icons';
import { State, City, Location, BusinessType, BusinessCategory, BusinessRegistrationService } from './business-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
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
    private router: Router,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      bid: [null],
      b_registration_num: ['', Validators.required],
      b_owner_name: ['', Validators.required],
      b_category_id: [null, Validators.required],
      b_type_id: [null, Validators.required],
      is_active: [true], // Default true
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
      privileged_user: [false], // Default false
    });

    addIcons({ save });
  }

  ngOnInit() {
    this.checkBusinessExistence();
  }

  private checkBusinessExistence() {
    this.businessRegistrationService.getBusinessExistsOrNot().subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.router.navigate(['/buyer/buyer-home']);
        } else {
          this.initializeRegistrationForm();
        }
      },
      error: (err: any) => {
        console.error('Error checking business existence:', err);
        this.initializeRegistrationForm();
      }
    });
  }

  private initializeRegistrationForm() {
    this.fetchBusinessCategories();
    this.fetchBusinessTypes();
    this.fetchStates();
    this.setUserId();
    this.setupFormListeners();
  }

  private setUserId() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    } else {
      console.warn('User ID not found');
    }
  }

  private setupFormListeners() {
    this.form.get('state_id')?.valueChanges.subscribe((stateId) => {
      if (stateId) {
        this.fetchCities(stateId);
        this.form.patchValue({ city_id: null, location_id: null });
        this.locations = [];
      } else {
        this.cities = [];
        this.locations = [];
        this.form.patchValue({ city_id: null, location_id: null });
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
      error: (err) => {
        console.error('Error loading business categories:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_CATEGORIES');
      },
    });
  }

  fetchBusinessTypes() {
    this.businessRegistrationService.getBusinessTypes().subscribe({
      next: (data) => (this.businessTypes = data),
      error: (err) => {
        console.error('Error loading business types:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_TYPES');
      },
    });
  }

  fetchStates() {
    this.businessRegistrationService.getStates().subscribe({
      next: (data) => (this.states = data),
      error: (err) => {
        console.error('Error loading states:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_STATES');
      },
    });
  }

  fetchCities(stateId: number) {
    this.businessRegistrationService.getCitiesOfState(stateId).subscribe({
      next: (data) => (this.cities = data),
      error: (err) => {
        console.error('Error loading cities:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_CITIES');
      },
    });
  }

  fetchLocations(cityId: number) {
    this.businessRegistrationService.getLocationsByCity(cityId).subscribe({
      next: (data) => (this.locations = data),
      error: (err) => {
        console.error('Error loading locations:', err);
        this.showErrorToast('BUSINESS_REGISTRATION.ERROR_LOAD_LOCATIONS');
      },
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      const payload = {
        ...this.form.value,
        city_id: this.form.value.city_id
      };

      this.businessRegistrationService.addNewBusiness(payload).subscribe({
        next: async () => {
          await this.showSuccessToast('BUSINESS_REGISTRATION.SUCCESS_MESSAGE');
          this.form.reset();
          this.router.navigate(['/buyer/buyer-home']);
        },
        error: async (err) => {
          console.error('Error registering business:', err);
          const message = err?.error?.error || 'BUSINESS_REGISTRATION.ERROR_REGISTER';
          await this.showErrorToast(message);
        }
      });
    } else {
      this.form.markAllAsTouched();
      await this.showErrorToast('BUSINESS_REGISTRATION.ERROR_FORM_INVALID');
    }
  }

  private async showErrorToast(messageKey: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      color: 'danger',
    });
    await toast.present();
  }

  private async showSuccessToast(messageKey: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 2000,
      color: 'success',
    });
    await toast.present();
  }
}