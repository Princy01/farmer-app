import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

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
  authMode: 'login' | 'register' = 'login'; // Toggle between Login & Register

  constructor(private fb: FormBuilder, private router: Router) {
    // Login Form
    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Register Form
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  emailOrPhoneValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return { required: true };

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const phonePattern = /^[0-9]{10}$/;

    if (emailPattern.test(value) || phonePattern.test(value)) {
      return null; // Valid
    }
    return { invalidFormat: true }; // Invalid
  }

  // Handle Login
  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email } = this.loginForm.value;
    const userRole = email === 'admin@example.com' ? 'admin' : 'user';

    // Navigate based on role
    this.router.navigate([userRole === 'admin' ? '/admin/category' : '/admin']);
  }

  // Handle Registration
  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Mock API call (replace with real API)
    console.log('User Registered:', this.registerForm.value);

    // After successful registration, switch to login form
    this.authMode = 'login';
  }
}
