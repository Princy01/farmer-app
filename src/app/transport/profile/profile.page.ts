import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonicModule,
  NavController,
  LoadingController,
  ToastController
} from '@ionic/angular';
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
  calendarOutline
} from 'ionicons/icons';

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
export class ProfilePage implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  driverData: any = {};
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private translate: TranslateService
    // private driverService: DriverService
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
      'calendar-outline': calendarOutline
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadDriverInfo();
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

      // Contact Information (Editable)
      contact_num: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      contact_num_addl: ['', [Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.email]],

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
  }

  async loadDriverInfo() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_INFO.LOADING'),
    });
    await loading.present();

    try {
      // Replace with actual service call
      // const data = await this.driverService.getDriverInfo().toPromise();

      // Mock data for demonstration
      const data = {
        first_name: 'John',
        last_name: 'Doe',
        dob: '1990-01-15',
        licence_no: 'DL1234567890',
        licence_type: 'HMV',
        licence_issued_date: '2015-01-01',
        licence_expiry_date: '2030-01-01',
        contact_num: '9876543210',
        contact_num_addl: '9876543211',
        email: 'john.doe@example.com',
        aadhar: '123456789012',
        pan: 'ABCDE1234F',
        address_door_no: '123',
        address_street: 'Main Street',
        address_state: 'TN',
        address_town: 'Chennai',
        address_pin_code: '600001',
        address_landmark: 'Near Temple',
        bank_ac_no: '1234567890',
        bank_name: 'State Bank',
        bank_branch: 'Main Branch',
        ifsc: 'SBIN0001234',
        bank_address: 'Bank Street, Chennai',
        veh_number: 'TN01AB1234',
        reg_date: '2020-01-01',
        vehicle_state: 'TN',
        type_id: '1',
        load_capacity: '5000',
        fuel_type: 'Diesel',
        profile_image: undefined,
        active_status: true,
        total_deliveries: 456,
        registration_date: '2023-03-20'
      };

      this.driverData = data;
      this.form.patchValue(data);
    } catch (error) {
      console.error('Error loading driver info:', error);
      await this.showToast('DRIVER_INFO.ERROR_LOADING', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  enableEdit() {
    this.isEditMode = true;
    // Enable only editable fields
    this.form.get('contact_num')?.enable();
    this.form.get('contact_num_addl')?.enable();
    this.form.get('email')?.enable();
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

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.showToast('DRIVER_INFO.INVALID_FORM', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('DRIVER_INFO.UPDATING'),
    });
    await loading.present();

    try {
      const updateData = {
        contact_num: this.form.get('contact_num')?.value,
        contact_num_addl: this.form.get('contact_num_addl')?.value,
        email: this.form.get('email')?.value,
        address_door_no: this.form.get('address_door_no')?.value,
        address_street: this.form.get('address_street')?.value,
        address_pin_code: this.form.get('address_pin_code')?.value,
        address_landmark: this.form.get('address_landmark')?.value,
        bank_ac_no: this.form.get('bank_ac_no')?.value,
        bank_name: this.form.get('bank_name')?.value,
        bank_branch: this.form.get('bank_branch')?.value,
        ifsc: this.form.get('ifsc')?.value,
        bank_address: this.form.get('bank_address')?.value,
      };

      // Replace with actual service call
      // await this.driverService.updateDriverInfo(updateData).toPromise();

      await this.showToast('DRIVER_INFO.UPDATE_SUCCESS', 'success');
      this.isEditMode = false;

      // Disable editable fields
      Object.keys(updateData).forEach(key => {
        this.form.get(key)?.disable();
      });

    } catch (error) {
      console.error('Error updating driver info:', error);
      await this.showToast('DRIVER_INFO.UPDATE_ERROR', 'danger');
    } finally {
      await loading.dismiss();
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

  getVehicleTypeName(typeId: string): string {
    const types: { [key: string]: string } = {
      '1': 'DRIVER_REGISTRATION.TRUCK',
      '2': 'DRIVER_REGISTRATION.VAN',
      '3': 'DRIVER_REGISTRATION.TEMPO',
      '4': 'DRIVER_REGISTRATION.OTHER',
    };
    return types[typeId] || typeId;
  }
}