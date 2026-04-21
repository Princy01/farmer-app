import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonicModule,
  NavController,
  LoadingController,
  ToastController,
  ModalController
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  create,
  personOutline,
  cardOutline,
  callOutline,
  fingerPrintOutline,
  locationOutline,
  businessOutline,
  carOutline,
  save,
  checkmarkCircleOutline,
  calendarOutline,
  closeCircleOutline,
  close,
  cameraOutline,
  starOutline
} from 'ionicons/icons';
import { DriverProfileService, UpdateDriverProfileRequest } from './profile.service';
import { EmailVerificationModalComponent } from './email-verification-modal.component';
import { MyPeerRatingResponse, TransportRatingsService } from '../ratings/transport-ratings.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonicModule
  ]
})
export class ProfilePage implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  driverData: any = {};
  today = new Date().toISOString().split('T')[0];
  isUploadingImage = false;
  isSubmitting = false;
  peerRatingLoading = false;
  peerRatingError: string | null = null;
  myPeerRating: MyPeerRatingResponse | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private driverProfileService: DriverProfileService,
    private transportRatingsService: TransportRatingsService
  ) {
    addIcons({
      'chevron-back': chevronBack,
      'create': create,
      'person-outline': personOutline,
      'card-outline': cardOutline,
      'call-outline': callOutline,
      'finger-print-outline': fingerPrintOutline,
      'location-outline': locationOutline,
      'business-outline': businessOutline,
      'car-outline': carOutline,
      'save': save,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'calendar-outline': calendarOutline,
      'close': close,
      'camera-outline': cameraOutline,
      'star-outline': starOutline
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadDriverInfo();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.form = this.fb.group({
      // Personal Information (Read-only)
      first_name: [{ value: '', disabled: true }],
      last_name: [{ value: '', disabled: true }],
      dob: [{ value: '', disabled: true }],

      // License Information (Read-only)
      licence_no: [{ value: '', disabled: true }],
      licence_type: [{ value: '', disabled: true }],
      licence_issued_date: [{ value: '', disabled: true }],
      licence_expiry_date: [{ value: '', disabled: true }],

      // Contact Information — editable via OTP flow only, kept readonly in form
      contact_num: [{ value: '', disabled: true }],
      contact_num_addl: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],

      // Identity Information (Read-only)
      aadhar: [{ value: '', disabled: true }],
      pan: [{ value: '', disabled: true }],

      // Address Information (Editable)
      address_door_no: [''],
      address_street: ['', Validators.required],
      address_state: [{ value: '', disabled: true }],
      address_town: [{ value: '', disabled: true }],
      address_pin_code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      address_landmark: [''],

      // Bank Information (Editable)
      bank_ac_no: ['', Validators.required],
      bank_name: ['', Validators.required],
      bank_branch: ['', Validators.required],
      ifsc: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],
      bank_address: ['', Validators.required],

      // Vehicle Information (Read-only)
      veh_number: [{ value: '', disabled: true }],
      reg_date: [{ value: '', disabled: true }],
      vehicle_state: [{ value: '', disabled: true }],
      type_id: [{ value: '', disabled: true }],
      load_capacity: [{ value: '', disabled: true }],
      fuel_type: [{ value: '', disabled: true }],
    });

    this.disableEditableFields();
  }

  async loadDriverInfo() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_INFO.LOADING'),
    });
    await loading.present();

    this.driverProfileService.getDriverProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Backend returns raw base64 — prefix it so the browser can render it
          if (data.profile_image && !data.profile_image.startsWith('data:')) {
            data.profile_image = `data:image/jpeg;base64,${data.profile_image}`;
          }
          this.driverData = data;
          this.form.patchValue({
            ...data,
            contact_num_addl: data.contact_num_addl ?? '',
            email: data.email ?? '',
            veh_number: data.veh_number ?? '',
            reg_date: data.reg_date ? data.reg_date.split('T')[0] : '',
            vehicle_state: data.vehicle_state ?? '',
            type_id: data.type_id ?? '',
            load_capacity: data.load_capacity ?? '',
            fuel_type: data.fuel_type ?? '',
            dob: data.dob ? data.dob.split('T')[0] : '',
            licence_issued_date: data.licence_issued_date ? data.licence_issued_date.split('T')[0] : '',
            licence_expiry_date: data.licence_expiry_date ? data.licence_expiry_date.split('T')[0] : '',
          });
          this.loadPeerRatingSummary();
          loading.dismiss();
        },
        error: (err) => {
          loading.dismiss();
          this.showToast('DRIVER_INFO.ERROR_LOADING', 'danger');
        }
      });
  }

  triggerImagePicker() {
    const input = document.getElementById('profileImageInput') as HTMLInputElement;
    input?.click();
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate type
    if (!file.type.startsWith('image/')) {
      await this.showToast('DRIVER_INFO.INVALID_IMAGE_TYPE', 'warning');
      return;
    }

    // Validate size — max 5 MB
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      await this.showToast('DRIVER_INFO.IMAGE_TOO_LARGE', 'warning');
      return;
    }

    const { base64, mimeType } = await this.fileToBase64(file);
    await this.uploadImage(base64, mimeType);

    // Reset so same file can be re-selected
    input.value = '';
  }

  private fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is "data:<mimeType>;base64,<data>"
        const [prefix, base64] = result.split(',');
        const mimeType = prefix.split(':')[1].split(';')[0]; // e.g. "image/png"
        resolve({ base64, mimeType });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private async uploadImage(base64: string, mimeType: string) {
    this.isUploadingImage = true;
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_INFO.UPLOADING_IMAGE'),
    });
    await loading.present();

    this.driverProfileService.uploadProfileImage({ image: base64 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Show immediate preview without a refetch
          this.driverData = { ...this.driverData, profile_image: `data:${mimeType};base64,${base64}` };
          loading.dismiss();
          this.isUploadingImage = false;
          this.showToast('DRIVER_INFO.IMAGE_UPLOAD_SUCCESS', 'success');
        },
        error: (err) => {
          loading.dismiss();
          this.isUploadingImage = false;
          this.showToast('DRIVER_INFO.IMAGE_UPLOAD_ERROR', 'danger');
        }
      });
  }

  enableEdit() {
    this.isEditMode = true;
    this.form.get('address_door_no')?.enable();
    this.form.get('address_street')?.enable();
    this.form.get('address_pin_code')?.enable();
    this.form.get('address_landmark')?.enable();
    this.form.get('bank_ac_no')?.enable();
    this.form.get('bank_name')?.enable();
    this.form.get('bank_branch')?.enable();
    this.form.get('ifsc')?.enable();
    this.form.get('bank_address')?.enable();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.disableEditableFields();
    this.form.patchValue(this.driverData);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private disableEditableFields() {
    const editableFields = [
      'address_door_no', 'address_street', 'address_pin_code', 'address_landmark',
      'bank_ac_no', 'bank_name', 'bank_branch', 'ifsc', 'bank_address'
    ];
    editableFields.forEach(field => this.form.get(field)?.disable());
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('DRIVER_INFO.INVALID_FORM', 'warning');
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_INFO.UPDATING'),
    });
    await loading.present();

    const updateData: UpdateDriverProfileRequest = {
      address_door_no: this.form.get('address_door_no')?.value || null,
      address_street: this.form.get('address_street')?.value || null,
      address_pin_code: this.form.get('address_pin_code')?.value || null,
      address_landmark: this.form.get('address_landmark')?.value || null,
      bank_ac_no: this.form.get('bank_ac_no')?.value || null,
      bank_name: this.form.get('bank_name')?.value || null,
      bank_branch: this.form.get('bank_branch')?.value || null,
      ifsc: this.form.get('ifsc')?.value || null,
      bank_address: this.form.get('bank_address')?.value || null,
    };

    this.driverProfileService.updateDriverProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Object.assign(this.driverData, updateData);
          loading.dismiss();
          this.isSubmitting = false;
          this.showToast('DRIVER_INFO.UPDATE_SUCCESS', 'success');
          this.isEditMode = false;
          this.disableEditableFields();
        },
        error: (err) => {
          loading.dismiss();
          this.isSubmitting = false;
          this.showToast('DRIVER_INFO.UPDATE_ERROR', 'danger');
        }
      });
  }

  onEditContactNum() {
    // TODO: Open OTP verification dialog for contact number change
  }

  onEditContactNumAddl() {
    // TODO: Open OTP verification dialog for additional contact number change
  }

  /**
   * Opens the email verification modal and triggers the driver email-change flow.
   *
   * The current email (or null if the driver has no email yet) is passed into the
   * modal so it can display it and allow the driver to enter a new address.
   *
   * Flow:
   *  1. Modal collects the new email from the driver.
   *  2. Modal calls DriverProfileService.requestDriverEmailChange(newEmail) which
   *     hits POST /auth/request-driver-email-change.
   *  3. Backend sends a verification email to the new address.
   *  4. Driver clicks the link → app handles /verify-email?token=... route.
   *  5. On modal dismiss with { emailUpdated: true }, the profile is refreshed.
   *
   * Passing `currentEmail` as null is valid — the backend accepts a nullable
   * new_email field and handles the "adding email for the first time" case.
   */
  async onEditEmail() {
    const currentEmail: string | null = this.driverData.email ?? null;

    const modal = await this.modalCtrl.create({
      component: EmailVerificationModalComponent,
      componentProps: {
        // Provide current email so the modal can show it and pass it along
        // if needed, and pass the service method reference for initiating the change.
        currentEmail,
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();

    // Refresh profile after a successful email change so the displayed
    // email reflects the newly verified address.
    if (data?.emailUpdated) {
      this.loadDriverInfo();
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(messageKey: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant(messageKey),
      duration: 3000,
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }

  getVehicleTypeName(typeId: string | number | null): string {
    if (typeId == null) return '';
    const types: { [key: string]: string } = {
      '1': 'DRIVER_REGISTRATION.TRUCK',
      '2': 'DRIVER_REGISTRATION.VAN',
      '3': 'DRIVER_REGISTRATION.TEMPO',
      '4': 'DRIVER_REGISTRATION.OTHER',
    };
    return types[String(typeId)] || String(typeId);
  }

  loadPeerRatingSummary(): void {
    this.peerRatingLoading = true;
    this.peerRatingError = null;

    this.transportRatingsService
      .getMyPeerRating()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.myPeerRating = summary;
          this.peerRatingLoading = false;
        },
        error: (err: Error) => {
          this.peerRatingLoading = false;
          this.peerRatingError = err.message;
        },
      });
  }
}