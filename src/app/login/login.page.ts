import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';
import { AuthService, UserRegistration, LoginCredentials, UserResponse } from '../services/auth.service';

enum UserRole {
  Admin = 1,
  Wholesaler = 2,
  Retailer = 3
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  registerForm: FormGroup;
  authMode: 'login' | 'register' = 'login';
  showLoginPassword: boolean = false;
  showRegisterPassword: boolean = false;

  userRoles = [
    { id: UserRole.Wholesaler, name: 'Wholesaler' },
    { id: UserRole.Retailer, name: 'Retailer' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {    addIcons({ eye, eyeOff });


  this.loginForm = this.fb.group({
    emailOrPhone: ['', [Validators.required, this.emailValidator]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      emailOrPhone: ['', [Validators.required, this.emailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]] // Add role field
    });
  }

  toggleLoginPasswordVisibility() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPasswordVisibility() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  emailValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return { required: true };

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(value) ? null : { invalidFormat: true };
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials: LoginCredentials = {
      email: this.loginForm.value.emailOrPhone,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response: UserResponse) => {
        // Navigate based on role_id
        switch (response.role_id) {
          case UserRole.Admin:
            this.router.navigate(['/admin/driver']);
            break;
          case UserRole.Wholesaler:
            this.router.navigate(['/wholesaler/home']);
            break;
          case UserRole.Retailer:
            this.router.navigate(['/buyer/buyer-home']);
            break;
          default:
            console.error('Unknown role');
            break;
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        // Show error message to user
        // You can implement showToast method for this
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const formValue = this.registerForm.value;


    const userData: UserRegistration = {
      name: formValue.name,
      mobile_num: formValue.emailOrPhone,
      email: formValue.emailOrPhone.includes('@') ? formValue.emailOrPhone : '',
      address: 'Default Address',
      pincode: '000000',
      location: 1,
      state: 1,
      active_status: 1,
      role_id: formValue.role // Using selected role
    };

    this.authService.registerUser(userData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.authMode = 'login';
        // Optional: Show success message using Ionic Toast
      },
      error: (error) => {
        console.error('Registration failed:', error);
        // Optional: Show error message using Ionic Toast
      }
    });
  }
}