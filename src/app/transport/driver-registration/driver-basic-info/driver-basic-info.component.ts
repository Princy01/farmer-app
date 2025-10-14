import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DriverBasicInfoService, DriverInfoRequest } from './driver-basic-info.service';

@Component({
  selector: 'app-driver-basic-info',
  templateUrl: './driver-basic-info.component.html',
  styleUrls: ['./driver-basic-info.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class DriverBasicInfoComponent implements OnInit {
  basicInfoForm!: FormGroup;
  isSubmitting = false;
  uploadedFiles: { [key: string]: File } = {};

  maxBirthDate: string;
  maxLicenseIssueDate: string;
  minLicenseExpiryDate: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private driverService: DriverBasicInfoService,
    private toastController: ToastController
  ) {
    const today = new Date();
    this.maxBirthDate = `${today.getFullYear() - 18}-12-31`;
    this.maxLicenseIssueDate = today.toISOString().split('T')[0];
    this.minLicenseExpiryDate = today.toISOString().split('T')[0];
  }

  // Get data from service instead of component properties
  get indianStates() {
    return this.driverService.indianStates;
  }

  get bloodGroups() {
    return this.driverService.bloodGroups;
  }

  get licenseTypes() {
    return this.driverService.licenseTypes;
  }

  ngOnInit() {
    this.initializeForm();
    this.loadExistingData();
  }

  initializeForm() {
    this.basicInfoForm = this.formBuilder.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      dob: ['', Validators.required],
      licence_no: ['', [Validators.required, Validators.minLength(10)]],
      licence_issed_date: ['', Validators.required],
      licence_expiry_datedate: ['', Validators.required],
      licence_type: ['', Validators.required],
      address_door_no: ['', Validators.required],
      address_street: ['', Validators.required],
      address_town: ['', Validators.required],
      address_state: ['', Validators.required],
      address_pin_code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      address_landmark: [''],
      contact_num: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      contact_num_addl: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      blood_group: [''],
      aadhar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      pan: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      bank_ac_no: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      bank_name: ['', Validators.required],
      bank_branch: ['', Validators.required],
      ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bank_address: ['', Validators.required],
      status: ['pending', Validators.required]
    });
  }

  loadExistingData() {
    const registrationData = this.driverService.getRegistrationData();
    if (registrationData.driverInfo && Object.keys(registrationData.driverInfo).length > 0) {
      this.basicInfoForm.patchValue(registrationData.driverInfo);
    }
  }

  onFileUpload(event: any, fileType: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG and PDF files are allowed');
        return;
      }

      this.uploadedFiles[fileType] = file;
    }
  }

  getFileName(fileType: string): string {
    return this.uploadedFiles[fileType]?.name || 'No file selected';
  }

  hasFile(fileType: string): boolean {
    return !!this.uploadedFiles[fileType];
  }

  async onSaveAndNext() {
    if (this.basicInfoForm.valid) {
      this.isSubmitting = true;

      try {
        // Prepare data for backend API
        const driverData: DriverInfoRequest = {
          first_name: this.basicInfoForm.value.first_name,
          last_name: this.basicInfoForm.value.last_name,
          licence_no: this.basicInfoForm.value.licence_no,
          licence_issed_date: this.basicInfoForm.value.licence_issed_date,
          licence_expiry_datedate: this.basicInfoForm.value.licence_expiry_datedate,
          licence_type: this.basicInfoForm.value.licence_type,
          address_door_no: this.basicInfoForm.value.address_door_no,
          address_street: this.basicInfoForm.value.address_street,
          address_town: this.basicInfoForm.value.address_town,
          address_state: this.basicInfoForm.value.address_state,
          address_pin_code: this.basicInfoForm.value.address_pin_code,
          address_landmark: this.basicInfoForm.value.address_landmark || '',
          contact_num: this.basicInfoForm.value.contact_num,
          contact_num_addl: this.basicInfoForm.value.contact_num_addl || '',
          email: this.basicInfoForm.value.email,
          aadhar: this.basicInfoForm.value.aadhar,
          pan: this.basicInfoForm.value.pan || '',
          bank_ac_no: this.basicInfoForm.value.bank_ac_no,
          bank_name: this.basicInfoForm.value.bank_name,
          bank_branch: this.basicInfoForm.value.bank_branch,
          ifsc: this.basicInfoForm.value.ifsc,
          bank_address: this.basicInfoForm.value.bank_address,
          status: this.basicInfoForm.value.status
        };

        // Submit to backend
        const response = await this.driverService.addDriver(driverData).toPromise();

        // Show success message
        const toast = await this.toastController.create({
          message: 'Driver information saved successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Update local registration service for next steps
        const formData = this.basicInfoForm.value;
        if (formData.dob) {
          formData.age = this.driverService.calculateAge(formData.dob);
        }

        // Store the driver_id returned from backend
        if (response && response.driver_id) {
          formData.driver_id = response.driver_id;
        }

        // Attach uploaded files
        if (this.uploadedFiles['aadhar']) {
          formData.aadhar_file = this.uploadedFiles['aadhar'];
        }
        if (this.uploadedFiles['pan']) {
          formData.pan_file = this.uploadedFiles['pan'];
        }
        if (this.uploadedFiles['photo']) {
          formData.driver_image = this.uploadedFiles['photo'];
        }

        this.driverService.updateDriverInfo(formData);
        this.driverService.setCurrentStep(2);

        // Navigate to next step
        this.router.navigate(['/transport/driver-registration/documents']);

      } catch (error: any) {
        console.error('Failed to save driver info:', error);

        const toast = await this.toastController.create({
          message: error.message || 'Failed to save driver information. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.basicInfoForm.controls).forEach(key => {
      this.basicInfoForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.basicInfoForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `${fieldName.replace('_', ' ')} is too short`;
      if (control.errors['pattern']) {
        if (fieldName === 'aadhar') return 'Aadhar number must be 12 digits';
        if (fieldName.includes('contact')) return 'Enter valid Indian mobile number';
        if (fieldName === 'pan') return 'Enter valid PAN format (e.g., ABCDE1234F)';
        if (fieldName === 'address_pin_code') return 'PIN code must be 6 digits';
        if (fieldName === 'bank_ac_no') return 'Account number must be 9-18 digits';
        if (fieldName === 'ifsc') return 'Enter valid IFSC code';
        return `${fieldName.replace('_', ' ')} format is invalid`;
      }
    }
    return '';
  }
}