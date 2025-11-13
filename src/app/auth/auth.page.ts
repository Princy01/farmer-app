import { Component } from '@angular/core';
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
export class LoginPage {
  loginForm: FormGroup;
  registerForm: FormGroup;
  authMode: 'login' | 'register' = 'login';
  showLoginPassword = false;
  showRegisterPassword = false;
  isLoading = false;
  states: State[] = [];
  cities: City[] = [];
  locations: Location[] = [];
  isLoadingStates = false;
  isLoadingCities = false;
  isLoadingLocations = false;

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
    private translate: TranslateService
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
      name: ['', Validators.required],
      identifier: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      state: [null, Validators.required],
      city: [null, Validators.required],
      location: [null, Validators.required],
      address: ['', Validators.required],
      pincode: ['', Validators.required],
      role_id: ['', Validators.required],
      active_status: [1]
    });

    this.loadStates();
    this.setupFormValueChanges();
  }

  setupFormValueChanges() {
    // Reset city and location when state changes
    this.registerForm.get('state')?.valueChanges.subscribe((stateId) => {
      if (stateId) {
        this.loadCities(stateId);
        this.registerForm.get('city')?.reset();
        this.registerForm.get('location')?.reset();
        this.cities = [];
        this.locations = [];
      }
    });

    // Reset location when city changes
    this.registerForm.get('city')?.valueChanges.subscribe((cityId) => {
      if (cityId) {
        this.loadLocations(cityId);
        this.registerForm.get('location')?.reset();
        this.locations = [];
      }
    });
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

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.presentToast(this.translate.instant('AUTH.LOGIN_SUCCESS'), 'success');

        const userRole = this.authService.getUserRole();

        // Navigate based on role
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
              console.error('Unknown role:', userRole);
              this.presentToast(this.translate.instant('AUTH.UNKNOWN_ROLE_ERROR'), 'danger');
          }
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed:', error);

        let errorMessage = this.translate.instant('AUTH.LOGIN_ERROR');

        if (error.error && error.error.error) {
          if (error.error.error.includes('invalid credentials') ||
            error.error.error.includes('Login failed')) {
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

    this.isLoading = true;

    // Create a copy of the form data
    const formData = { ...this.registerForm.value };

    // Map form data to match backend expectations
    const userData = {
      identifier: formData.identifier,
      password: formData.password,
      name: formData.name,
      address: formData.address,
      pincode: formData.pincode,
      location: formData.location, // This is the location ID
      state: formData.state, // This is the state ID
      role_id: formData.role_id,
      active_status: formData.active_status
    };

    this.authService.registerUser(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.presentToast(this.translate.instant('AUTH.REGISTER_SUCCESS'), 'success');

        // Reset the form and return to login mode
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
        this.authMode = 'login';
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration failed:', error);

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
    this.authService.getStates().subscribe({
      next: (states) => {
        this.states = states;
        this.isLoadingStates = false;
      },
      error: (error) => {
        console.error('Failed to load states:', error);
        this.isLoadingStates = false;
        this.presentToast(this.translate.instant('AUTH.LOAD_STATES_ERROR'), 'danger');
      }
    });
  }

  loadCities(stateId: number) {
    this.isLoadingCities = true;
    this.authService.getCitiesOfState(stateId).subscribe({
      next: (cities) => {
        this.cities = cities;
        this.isLoadingCities = false;
      },
      error: (error) => {
        console.error('Failed to load cities:', error);
        this.isLoadingCities = false;
        this.presentToast(this.translate.instant('AUTH.LOAD_CITIES_ERROR'), 'danger');
      }
    });
  }

  loadLocations(cityId: number) {
    this.isLoadingLocations = true;
    this.authService.getLocationsByCity(cityId).subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoadingLocations = false;
      },
      error: (error) => {
        console.error('Failed to load locations:', error);
        this.isLoadingLocations = false;
        this.presentToast(this.translate.instant('AUTH.LOAD_LOCATIONS_ERROR'), 'danger');
      }
    });
  }
}