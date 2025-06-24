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
import { AuthService, UserRegistration, LoginCredentials } from './auth.service';

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
      address: ['Default Address'],
      location: [0],
      state: [0],
      pincode: ['000000'],
      role_id: ['', Validators.required],
      active_status: [1]
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

  onActiveStatusChange(event: any) {
  // Convert boolean to number (0 or 1)
  const value = event.detail.checked ? 1 : 0;
  this.registerForm.get('active_status')?.setValue(value);
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

      // You may need to modify this based on how you're handling user roles
      setTimeout(() => {
        // For demonstration, using a fixed role
        // In a real app, you would get this from the user's profile or JWT token
        const userRole: number = UserRole.Wholesaler;

        // Compare by number value
        if (userRole === UserRole.Admin) {
          this.router.navigate(['/admin/driver']);
        } else if (userRole === UserRole.Wholesaler) {
          this.router.navigate(['/wholesaler/home']);
        } else if (userRole === UserRole.Retailer) {
          this.router.navigate(['/buyer/buyer-home']);
        } else {
          console.error('Unknown role');
        }
      }, 1000);
    },
    error: (error) => {
      this.isLoading = false;
      console.error('Login failed:', error);
      let errorMessage = 'Login failed. Please try again.';

      if (error.error && error.error.error) {
        errorMessage = error.error.error;
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
  const formData = {...this.registerForm.value};

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

  console.log('Sending registration data:', userData);

  this.authService.registerUser(userData).subscribe({
    next: (response) => {
      this.isLoading = false;
      console.log('Registration successful:', response);
      this.presentToast('Registration successful! Please login.', 'success');

      // Reset the form and return to login mode
      this.registerForm.reset({
        // Set default values for non-required fields
        address: 'Default Address',
        location: 0,
        state: 0,
        pincode: '000000',
        active_status: 1
      });
      this.authMode = 'login';
    },
    error: (error) => {
      this.isLoading = false;
      console.error('Registration failed:', error);
      let errorMessage = 'Registration failed. Please try again.';

      // Extract the most helpful error message
      if (error.error && typeof error.error === 'object' && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid registration data. Please check your inputs.';
      } else if (error.status === 409) {
        errorMessage = 'User with this email or phone already exists.';
      }

      this.presentToast(errorMessage, 'danger');
    }
  });
}
}