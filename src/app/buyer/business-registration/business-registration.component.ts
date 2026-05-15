import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, informationCircleOutline, documentTextOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { BusinessRegistrationService } from './business-registration.service';
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
  isSubmitting = false;

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
      is_active: [true],
      user_id: [null, Validators.required],
      pan_number: ['', [Validators.required, Validators.pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)]],
      aadhaar_number: [''],
      government_license_number: [''],
      privileged_user: [false],
    });

    addIcons({ businessOutline, informationCircleOutline, documentTextOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.checkBusinessExistence();
  }

  private checkBusinessExistence() {
    this.businessRegistrationService.getBusinessExistsOrNot().subscribe({
      next: (exists: boolean) => {
        console.log('Business existence check result:', exists);
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
    this.setUserId();
  }

  private setUserId() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.form.get('user_id')?.setValue(userId);
    } else {
      console.warn('User ID not found');
    }
  }

  async onSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      await this.showErrorToast('BUSINESS_REGISTRATION.ERROR_FORM_INVALID');
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const loading = await this.toastCtrl.create({
      message: this.translate.instant('BUSINESS_REGISTRATION.SUBMITTING'),
    });

    const payload = this.form.value;

    this.businessRegistrationService.addNewBusiness(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.showSuccessToast('BUSINESS_REGISTRATION.SUCCESS_MESSAGE');
        this.form.reset();
        this.router.navigate(['/buyer/add-business-location']);
      },
      error: async (err) => {
        this.isSubmitting = false;
        console.error('Error registering business:', err);
        const message = err?.error?.error || 'BUSINESS_REGISTRATION.ERROR_REGISTER';
        await this.showErrorToast(message);
      }
    });
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