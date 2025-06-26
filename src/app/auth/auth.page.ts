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
import { AuthService, UserRegistration, LoginCredentials, Location, State } from './auth.service';

enum UserRole {
  Admin = 1,
  Wholesaler = 2,
  Retailer = 3
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
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
  locations: Location[] = [];
  states: State[] = [];
  isLoadingLocations = false;
  isLoadingStates = false;

  userRoles = [
    { id: UserRole.Wholesaler, name: 'Wholesaler' },
    { id: UserRole.Retailer, name: 'Retailer' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastController: ToastController
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
      address: [''],
      location: ['', Validators.required],
      state: ['', Validators.required],
      pincode: [''],
      role_id: ['', Validators.required],
      active_status: [1]
    });
    this.loadLocations();
    this.loadStates();
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
        this.presentToast('Login successful', 'success');

        const roleId = response.role_id;

        // Navigate based on role
        setTimeout(() => {
          if (roleId === UserRole.Admin) {
            this.router.navigate(['/admin/driver']);
          } else if (roleId === UserRole.Wholesaler) {
            this.router.navigate(['/wholesaler/home']);
          } else if (roleId === UserRole.Retailer) {
            this.router.navigate(['/buyer/buyer-home']);
          } else {
            // Log the technical error for developers
            console.error('Unknown role:', roleId);
            // Show a user-friendly message
            this.presentToast('Unable to access your account. Please contact support.', 'danger');
          }
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;

        // Log the full error for developers
        console.error('Login failed:', error);

        // User-friendly error message
        let errorMessage = 'Unable to log in. Please check your credentials and try again.';

        // Extract specific error messages from the backend if available
        if (error.error && error.error.error) {
          // Check if it's a user-friendly message from the backend
          if (error.error.error.includes('invalid credentials') ||
            error.error.error.includes('Login failed')) {
            errorMessage = 'Invalid email/phone or password.';
          }
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to the server. Please check your internet connection.';
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

    // IMPORTANT: The backend expects an "identifier" field, not email/mobile_num
    // The backend will determine if it's an email or phone number
    const userData = {
      identifier: formData.identifier,   // This is the key field the backend expects
      password: formData.password,
      name: formData.name,
      address: formData.address,
      pincode: formData.pincode,
      location: formData.location,
      state: formData.state,
      role_id: formData.role_id,
      active_status: formData.active_status
    };

    this.authService.registerUser(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.presentToast('Registration successful! Please login.', 'success');

        // Reset the form and return to login mode
        this.registerForm.reset({
          address: '',
          location: '',
          state: '',
          pincode: '',
          active_status: 1
        });
        this.authMode = 'login';
      },
      error: (error) => {
        this.isLoading = false;

        // Log full error details for developers
        console.error('Registration failed:', error);

        // User-friendly error message
        let errorMessage = 'Unable to create your account. Please try again later.';

        // Extract the most helpful error message
        if (error.error && typeof error.error === 'object' && error.error.error) {
          // Check if it contains user-friendly info
          if (error.error.error.includes('already exists')) {
            errorMessage = 'An account with this email or phone number already exists.';
          } else if (error.error.error.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
          }
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to the server. Please check your internet connection.';
        } else if (error.status === 400) {
          errorMessage = 'Please check your information and try again.';
        }

        this.presentToast(errorMessage, 'danger');
      }
    });
  }
  loadLocations() {
    this.isLoadingLocations = true;
    this.authService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoadingLocations = false;
      },
      error: (error) => {
        console.error('Failed to load locations:', error);
        this.isLoadingLocations = false;
        this.presentToast('Failed to load locations. Please try again.', 'danger');
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
        this.presentToast('Failed to load states. Please try again.', 'danger');
      }
    });
  }
}