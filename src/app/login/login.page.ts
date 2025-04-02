import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

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

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ eye, eyeOff });

    this.loginForm = this.fb.group({
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const phonePattern = /^[0-9]{10}$/;

    if (emailPattern.test(value) || phonePattern.test(value)) {
      return null;
    }
    return { invalidFormat: true };
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { emailOrPhone } = this.loginForm.value;

    let userRole: string;
    switch (emailOrPhone) {
      case 'admin@example.com':
        userRole = 'admin';
        break;
      case 'wholesaler@example.com':
        userRole = 'wholesaler';
        break;
      case 'retailer@example.com':
        userRole = 'retailer';
        break;
      case 'transporter@example.com':
        userRole = 'transporter';
        break;
      default:
        console.error('Invalid login credentials');
        return;
    }

    switch (userRole) {
      case 'admin':
        this.router.navigate(['/admin/driver']);
        break;
      case 'wholesaler':
        this.router.navigate(['/home']);
        break;
      case 'retailer':
        this.router.navigate(['/buyer/buyer-home']);
        break;
      case 'transporter':
        this.router.navigate(['/transport/transport-requests']);
        break;
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    console.log('User Registered:', this.registerForm.value);
    this.authMode = 'login';
  }
}