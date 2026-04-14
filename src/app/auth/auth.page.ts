import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  eye, eyeOff, eyeOutline, eyeOffOutline,
  mailOutline, lockClosedOutline, personOutline,
  businessOutline, storefrontOutline, storefront,
  carOutline, shieldCheckmarkOutline, logInOutline,
  personAddOutline, locationOutline, mapOutline
} from 'ionicons/icons';
import { AuthService, UserRegistration, LoginCredentials, Location, State, City } from './auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TranslateApiService } from '@/services/translate-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


enum UserRole {
  Admin = 1,
  Wholesaler = 2,
  Retailer = 3,
  Driver = 4
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, TranslatePipe],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class LoginPage implements OnDestroy {
  loginForm: FormGroup;
  registerForm: FormGroup;
  authMode: 'login' | 'register' | 'verify-email' = 'login';
  showLoginPassword = false;
  showRegisterPassword = false;
  isLoading = false;
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  filteredCities: City[] = [];
  filteredLocations: Location[] = [];
  citySearchTerm = '';
  locationSearchTerm = '';
  showCitySuggestions = false;
  showLocationSuggestions = false;
  isLoadingStates = false;
  isLoadingCities = false;
  isLoadingLocations = false;

  pendingVerificationEmail: string = '';
  isResending: boolean = false;
  resendCooldown: number = 0;
  private cooldownTimer: any;
  private destroy$ = new Subject<void>();

  userRoles = [
    { id: UserRole.Wholesaler, name: 'AUTH.ROLE_WHOLESALER' },
    { id: UserRole.Retailer, name: 'AUTH.ROLE_RETAILER' },
    { id: UserRole.Driver, name: 'AUTH.ROLE_DRIVER' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController,
    private translate: TranslateService,
    private translateApiService: TranslateApiService
  ) {
    addIcons({
      eye, eyeOff, eyeOutline, eyeOffOutline,
      mailOutline, lockClosedOutline, personOutline,
      businessOutline, storefrontOutline, storefront,
      carOutline, shieldCheckmarkOutline, logInOutline,
      personAddOutline, locationOutline, mapOutline
    });

    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      identifier: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      state: [null, Validators.required],
      city: [null, Validators.required],
      location: [null, Validators.required],
      address: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      role_id: ['', Validators.required],
      active_status: [1]
    });

    this.loadStates();
    this.setupFormValueChanges();
  }

  private initUserLanguage() {
    const legacy = localStorage.getItem('wholesaler_language')
      || localStorage.getItem('retailer_language');
    if (legacy) {
      localStorage.setItem('preferred_language', legacy);
      localStorage.removeItem('wholesaler_language');
      localStorage.removeItem('retailer_language');
    }

    const savedLang = localStorage.getItem('preferred_language') || 'en';


    this.translate.use(savedLang);

    this.translateApiService.getUserPreference().subscribe({
      next: (pref) => {
        const code = pref?.code?.toLowerCase() || savedLang;
        this.translate.use(code);
        localStorage.setItem('preferred_language', code);
      },
      error: () => {
        // Already applied saved/default above, nothing to do
      }
    });
  }

  setupFormValueChanges() {
    // Reset city and location when state changes
    this.registerForm.get('state')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((stateId) => {
        this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
        this.cities = [];
        this.locations = [];
        this.filteredCities = [];
        this.filteredLocations = [];
        this.citySearchTerm = '';
        this.locationSearchTerm = '';
        this.showCitySuggestions = false;
        this.showLocationSuggestions = false;

        if (stateId) {
          this.loadCities(stateId);
        }
      });

    // Reset location when city changes
    this.registerForm.get('city')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((cityId) => {
        this.registerForm.get('location')?.reset(null, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
        this.showLocationSuggestions = false;

        if (cityId) {
          this.loadLocations(cityId);
        }
      });
  }

  onCitySearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.citySearchTerm = String(rawValue);

    const selectedCityId = this.registerForm.get('city')?.value;
    if (selectedCityId) {
      const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
      if (selectedCity && selectedCity.city_name.toLowerCase() !== this.citySearchTerm.trim().toLowerCase()) {
        this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
        this.locations = [];
        this.filteredLocations = [];
        this.locationSearchTerm = '';
      }
    }

    this.filterCities();
    this.showCitySuggestions = !!this.registerForm.get('state')?.value;
  }

  onLocationSearchChange(event: Event | CustomEvent): void {
    const rawValue = (event as CustomEvent)?.detail?.value ?? (event.target as HTMLInputElement)?.value ?? '';
    this.locationSearchTerm = String(rawValue);

    const selectedLocationId = this.registerForm.get('location')?.value;
    if (selectedLocationId) {
      const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
      if (selectedLocation && (selectedLocation.location_name ?? '').toLowerCase() !== this.locationSearchTerm.trim().toLowerCase()) {
        this.registerForm.get('location')?.setValue(null, { emitEvent: false });
      }
    }

    this.filterLocations();
    this.showLocationSuggestions = !!this.registerForm.get('city')?.value;
  }

  onCityInputFocus(): void {
    if (!this.registerForm.get('state')?.value) {
      return;
    }
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = true;
  }

  onCityInputBlur(): void {
    this.registerForm.get('city')?.markAsTouched();
    setTimeout(() => {
      this.showCitySuggestions = false;
    }, 150);
  }

  onLocationInputFocus(): void {
    if (!this.registerForm.get('city')?.value) {
      return;
    }
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = true;
  }

  onLocationInputBlur(): void {
    this.registerForm.get('location')?.markAsTouched();
    setTimeout(() => {
      this.showLocationSuggestions = false;
    }, 150);
  }

  selectCity(city: City, event?: Event): void {
    event?.preventDefault();
    this.registerForm.patchValue({ city: city.id, location: null }, { emitEvent: false });
    this.citySearchTerm = city.city_name;
    this.locationSearchTerm = '';
    this.showCitySuggestions = false;
    this.locations = [];
    this.filteredLocations = [];
    this.loadLocations(city.id);
  }

  selectLocation(location: Location, event?: Event): void {
    event?.preventDefault();
    this.registerForm.get('location')?.setValue(location.id, { emitEvent: false });
    this.locationSearchTerm = location.location_name ?? '';
    this.showLocationSuggestions = false;
  }

  clearSelectedCity(): void {
    this.registerForm.patchValue({ city: null, location: null }, { emitEvent: false });
    this.citySearchTerm = '';
    this.locationSearchTerm = '';
    this.locations = [];
    this.filteredLocations = [];
    this.filteredCities = [...this.cities];
    this.showCitySuggestions = false;
    this.showLocationSuggestions = false;
  }

  clearSelectedLocation(): void {
    this.registerForm.get('location')?.setValue(null, { emitEvent: false });
    this.locationSearchTerm = '';
    this.filteredLocations = [...this.locations];
    this.showLocationSuggestions = false;
  }

  toggleLoginPasswordVisibility() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPasswordVisibility() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  emailOrPhoneValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return { required: true };

    // Simple email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // Simple phone validation (numeric, 10+ digits)
    const phonePattern = /^[0-9]{10,15}$/;

    if (emailPattern.test(value) || phonePattern.test(value)) {
      return null;
    }

    return { invalidFormat: true };
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const credentials: LoginCredentials = {
      identifier: this.loginForm.value.identifier,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Check if email verification is required
          if (response.email_verification_required) {
            this.pendingVerificationEmail = credentials.identifier;
            this.authMode = 'verify-email';
            this.presentToast(
              this.translate.instant('AUTH.EMAIL_NOT_VERIFIED'),
              'warning'
            );
            return;
          }

          this.presentToast(this.translate.instant('AUTH.LOGIN_SUCCESS'), 'success');
          this.initUserLanguage();

          const userRole = this.authService.getUserRole();
          setTimeout(() => {
            switch (userRole) {
              case 'admin':
                this.router.navigate(['/admin/driver']);
                break;
              case 'wholesaler':
                this.router.navigate(['/wholesaler/business-registration']);
                break;
              case 'retailer':
                this.router.navigate(['/buyer/business-registration']);
                break;
              case 'driver':
                this.router.navigate(['/transport/driver-registration']);
                break;
              default:
                this.presentToast(this.translate.instant('AUTH.UNKNOWN_ROLE_ERROR'), 'danger');
            }
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = this.translate.instant('AUTH.LOGIN_ERROR');

          // Check for email verification error
          if (error.status === 403 && error.error && error.error.error === 'email_not_verified') {
            this.pendingVerificationEmail = credentials.identifier;
            this.authMode = 'verify-email';
            errorMessage = this.translate.instant('AUTH.EMAIL_NOT_VERIFIED');
          } else if (error.error && error.error.error) {
            if (error.error.error.includes('invalid credentials')) {
              errorMessage = this.translate.instant('AUTH.INVALID_CREDENTIALS');
            }
          } else if (error.status === 0) {
            errorMessage = this.translate.instant('AUTH.CONNECTION_ERROR');
          }

          this.presentToast(errorMessage, 'danger');
        }
      });
  }


  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.citySearchTerm.trim() && !this.registerForm.get('city')?.value) {
      this.registerForm.get('city')?.markAsTouched();
      this.presentToast(this.translate.instant('AUTH.SELECT_CITY_FROM_LIST'), 'warning');
      return;
    }

    if (this.locationSearchTerm.trim() && !this.registerForm.get('location')?.value) {
      this.registerForm.get('location')?.markAsTouched();
      this.presentToast(this.translate.instant('AUTH.SELECT_LOCATION_FROM_LIST'), 'warning');
      return;
    }

    this.isLoading = true;
    const formData = { ...this.registerForm.value };

    const userData = {
      identifier: formData.identifier,
      password: formData.password,
      name: formData.name,
      address: formData.address,
      pincode: formData.pincode,
      location: formData.location,
      state: formData.state,
      role_id: formData.role_id,
      active_status: formData.active_status
    };

    this.authService.registerUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Check if email verification is required
          if (response.email_verification_required) {
            this.pendingVerificationEmail = formData.identifier;
            this.authMode = 'verify-email';
            this.presentToast(
              this.translate.instant('AUTH.VERIFICATION_EMAIL_SENT'),
              'success'
            );
          } else {
            // Phone registration - no verification needed
            this.presentToast(this.translate.instant('AUTH.REGISTER_SUCCESS'), 'success');
            this.registerForm.reset({
              state: null,
              city: null,
              location: null,
              address: '',
              pincode: '',
              active_status: 1
            });
            this.cities = [];
            this.locations = [];
            this.filteredCities = [];
            this.filteredLocations = [];
            this.citySearchTerm = '';
            this.locationSearchTerm = '';
            this.showCitySuggestions = false;
            this.showLocationSuggestions = false;
            this.authMode = 'login';
          }
        },
        error: (error) => {
          this.isLoading = false;

          let errorMessage = this.translate.instant('AUTH.REGISTER_ERROR');

          if (error.error && typeof error.error === 'object' && error.error.error) {
            if (error.error.error.includes('already exists')) {
              errorMessage = this.translate.instant('AUTH.USER_EXISTS_ERROR');
            } else if (error.error.error.includes('Invalid email')) {
              errorMessage = this.translate.instant('AUTH.INVALID_EMAIL_ERROR');
            }
          } else if (error.status === 0) {
            errorMessage = this.translate.instant('AUTH.CONNECTION_ERROR');
          } else if (error.status === 400) {
            errorMessage = this.translate.instant('AUTH.VALIDATION_ERROR');
          }

          this.presentToast(errorMessage, 'danger');
        }
      });
  }


  loadStates() {
    this.isLoadingStates = true;
    this.authService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (states) => {
          this.states = states;
          this.isLoadingStates = false;
        },
        error: (error) => {
          this.isLoadingStates = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_STATES_ERROR'), 'danger');
        }
      });
  }

  loadCities(stateId: number) {
    this.isLoadingCities = true;
    this.authService.getCitiesOfState(stateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          this.cities = cities;
          this.filteredCities = [...cities];
          this.syncCitySearchFromSelection();
          this.isLoadingCities = false;
        },
        error: (error) => {
          this.isLoadingCities = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_CITIES_ERROR'), 'danger');
        }
      });
  }

  loadLocations(cityId: number) {
    this.isLoadingLocations = true;
    this.authService.getLocationsByCity(cityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locations = locations;
          this.filteredLocations = [...locations];
          this.syncLocationSearchFromSelection();
          this.isLoadingLocations = false;
        },
        error: (error) => {
          this.isLoadingLocations = false;
          this.presentToast(this.translate.instant('AUTH.LOAD_LOCATIONS_ERROR'), 'danger');
        }
      });
  }

  async resendVerificationEmail() {
    if (this.resendCooldown > 0) return;

    this.isResending = true;
    this.authService.resendVerification(this.pendingVerificationEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isResending = false;
          this.presentToast(this.translate.instant('AUTH.VERIFICATION_EMAIL_RESENT'), 'success');
          this.startCooldown(60);
        },
        error: (error) => {
          this.isResending = false;
          let errorMessage = this.translate.instant('AUTH.RESEND_FAILED');
          if (error.error && error.error.error === 'Email already verified') {
            errorMessage = this.translate.instant('AUTH.EMAIL_ALREADY_VERIFIED');
            this.authMode = 'login';
          }
          this.presentToast(errorMessage, 'danger');
        }
      });
  }

  private startCooldown(seconds: number) {
    this.resendCooldown = seconds;
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownTimer);
      }
    }, 1000);
  }

  backToLogin() {
    this.authMode = 'login';
    this.pendingVerificationEmail = '';
    this.loginForm.reset();
  }

  private filterCities(): void {
    const searchTerm = this.citySearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredCities = [...this.cities];
      return;
    }

    this.filteredCities = this.cities.filter((city) =>
      city.city_name.toLowerCase().includes(searchTerm) ||
      city.city_shortname.toLowerCase().includes(searchTerm)
    );
  }

  private filterLocations(): void {
    const searchTerm = this.locationSearchTerm.trim().toLowerCase();
    if (!searchTerm) {
      this.filteredLocations = [...this.locations];
      return;
    }

    this.filteredLocations = this.locations.filter((location) =>
      (location.location_name ?? '').toLowerCase().includes(searchTerm)
    );
  }

  private syncCitySearchFromSelection(): void {
    const selectedCityId = this.registerForm.get('city')?.value;
    if (!selectedCityId) {
      return;
    }

    const selectedCity = this.cities.find((city) => city.id === Number(selectedCityId));
    this.citySearchTerm = selectedCity?.city_name ?? '';
  }

  private syncLocationSearchFromSelection(): void {
    const selectedLocationId = this.registerForm.get('location')?.value;
    if (!selectedLocationId) {
      return;
    }

    const selectedLocation = this.locations.find((location) => location.id === Number(selectedLocationId));
    this.locationSearchTerm = selectedLocation?.location_name ?? '';
  }

  ngOnDestroy() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}