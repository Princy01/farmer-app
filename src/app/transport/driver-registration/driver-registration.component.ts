import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { DriverService, CompleteDriverRequest, DriverInfoRequest, DocumentType, DriverVehicleInfo, VehicleInsuranceInfo } from './driver-registration.service';

interface DriverFormData {
  basicInfo: DriverInfoRequest;
  documents: DocumentType;
  vehicle: DriverVehicleInfo;
  insurance: VehicleInsuranceInfo;
}

@Component({
  selector: 'app-driver-registration',
  templateUrl: './driver-registration.component.html',
  styleUrls: ['./driver-registration.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class DriverRegistrationComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;

  // Add date properties for template
  today = new Date().toISOString();
  tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString();

  basicInfoForm!: FormGroup;
  documentsForm!: FormGroup;
  vehicleForm!: FormGroup;
  insuranceForm!: FormGroup;

  formData: DriverFormData = {
    basicInfo: {} as DriverInfoRequest,
    documents: {} as DocumentType,
    vehicle: {} as DriverVehicleInfo,
    insurance: {} as VehicleInsuranceInfo
  };

  constructor(
    private fb: FormBuilder,
    private driverService: DriverService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  initializeForms() {
    // Basic Info Form - ALL FIELDS REQUIRED
    this.basicInfoForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      licence_no: ['', [Validators.required]],
      licence_issued_date: ['', [Validators.required]],
      licence_expiry_date: ['', [Validators.required]],
      licence_type: ['', [Validators.required]],
      address_door_no: ['', [Validators.required]],
      address_street: ['', [Validators.required]],
      address_town: ['', [Validators.required]],
      address_state: ['', [Validators.required]],
      address_pin_code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      address_landmark: ['', [Validators.required]],
      contact_num: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contact_num_addl: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      aadhar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      pan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      bank_ac_no: ['', [Validators.required]],
      bank_name: ['', [Validators.required]],
      bank_branch: ['', [Validators.required]],
      ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bank_address: ['', [Validators.required]],
      status: ['active']
    });

    // Documents Form - ALL FIELDS REQUIRED
    this.documentsForm = this.fb.group({
      aadhar_img: ['', [Validators.required]],
      pan_img: ['', [Validators.required]],
      driver_img: ['', [Validators.required]],
      insurance_img: ['', [Validators.required]],
      rc_img: ['', [Validators.required]],
      license_img: ['', [Validators.required]]
    });

    // Vehicle Form - ALL FIELDS REQUIRED
    this.vehicleForm = this.fb.group({
      veh_number: ['', [Validators.required]],
      reg_date: ['', [Validators.required]],
      state: ['', [Validators.required]],
      type_id: [null, [Validators.required, Validators.min(1)]],
      veh_make: ['', [Validators.required]],
      veh_model: ['', [Validators.required]],
      load_capacity: [null, [Validators.required, Validators.min(1)]],
      fuel_type: ['', [Validators.required]],
      kms_travelled: [null, [Validators.required, Validators.min(0)]]
    });

    // Insurance Form - ALL FIELDS REQUIRED
    this.insuranceForm = this.fb.group({
      frm_date: ['', [Validators.required]],
      to_date: ['', [Validators.required]],
      ins_company: ['', [Validators.required]],
      amt_insured: [null, [Validators.required, Validators.min(1)]]
    });
  }

  async nextStep() {
    const currentForm = this.getCurrentForm();

    if (currentForm && currentForm.invalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      this.markFormGroupTouched(currentForm);
      return;
    }

    this.saveCurrentStepData();

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getCurrentForm(): FormGroup | null {
    switch (this.currentStep) {
      case 1: return this.basicInfoForm;
      case 2: return this.documentsForm;
      case 3: return this.vehicleForm;
      case 4: return this.insuranceForm;
      default: return null;
    }
  }

  saveCurrentStepData() {
    switch (this.currentStep) {
      case 1:
        this.formData.basicInfo = this.prepareBasicInfoData();
        break;
      case 2:
        this.formData.documents = this.documentsForm.value;
        break;
      case 3:
        this.formData.vehicle = this.prepareVehicleData();
        break;
      case 4:
        this.formData.insurance = this.prepareInsuranceData();
        break;
    }
  }

  prepareBasicInfoData(): DriverInfoRequest {
    const formValue = this.basicInfoForm.value;

    // Convert date objects to strings in YYYY-MM-DD format
    const licenceIssuedDate = formValue.licence_issued_date ?
      new Date(formValue.licence_issued_date).toISOString().split('T')[0] : '';
    const licenceExpiryDate = formValue.licence_expiry_date ?
      new Date(formValue.licence_expiry_date).toISOString().split('T')[0] : '';

    return {
      ...formValue,
      licence_issued_date: licenceIssuedDate,
      licence_expiry_date: licenceExpiryDate
    };
  }

  prepareVehicleData(): DriverVehicleInfo {
    const formValue = this.vehicleForm.value;

    // Convert date to string format
    const regDate = formValue.reg_date ?
      new Date(formValue.reg_date).toISOString().split('T')[0] : '';

    return {
      ...formValue,
      reg_date: regDate,
      type_id: Number(formValue.type_id),
      load_capacity: Number(formValue.load_capacity),
      kms_travelled: Number(formValue.kms_travelled)
    };
  }

  prepareInsuranceData(): VehicleInsuranceInfo {
    const formValue = this.insuranceForm.value;

    // Convert dates to string format
    const frmDate = formValue.frm_date ?
      new Date(formValue.frm_date).toISOString().split('T')[0] : '';
    const toDate = formValue.to_date ?
      new Date(formValue.to_date).toISOString().split('T')[0] : '';

    return {
      ...formValue,
      frm_date: frmDate,
      to_date: toDate,
      amt_insured: Number(formValue.amt_insured)
    };
  }

  async onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        await this.showToast('File size should be less than 5MB', 'warning');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        await this.showToast('Please select an image file', 'warning');
        return;
      }

      try {
        const base64 = await this.convertToBase64(file);
        this.documentsForm.patchValue({
          [fieldName]: base64
        });
        await this.showToast('File uploaded successfully', 'success');
      } catch (error) {
        await this.showToast('Error uploading file', 'danger');
      }
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async submitForm() {
    const loading = await this.loadingController.create({
      message: 'Submitting driver registration...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Save current step data
      this.saveCurrentStepData();

      // Prepare payload matching backend structure
      const payload: CompleteDriverRequest = {
        driver_info: this.formData.basicInfo,
        documents: this.formData.documents,
        vehicle: this.formData.vehicle,
        insurance: this.formData.insurance
      };

      console.log('Submitting payload:', payload);

      const response = await this.driverService.addCompleteDriver(payload).toPromise();

      await loading.dismiss();
      await this.showSuccessAlert(response);
      this.resetForm();

    } catch (error: any) {
      await loading.dismiss();
      console.error('Submission error:', error);

      const errorMessage = error.error?.error || error.message || 'Unknown error occurred';
      await this.showErrorAlert(errorMessage);
    }
  }

  async showSuccessAlert(response: any) {
    const alert = await this.alertController.create({
      header: 'Registration Successful!',
      message: `
        Driver registered successfully!
        Driver ID: ${response.driver_id}
        ${response.vehicle_id ? `Vehicle ID: ${response.vehicle_id}` : ''}
        ${response.uploaded_documents?.length ? `Documents uploaded: ${response.uploaded_documents.join(', ')}` : ''}
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showErrorAlert(errorMessage: string) {
    const alert = await this.alertController.create({
      header: 'Registration Failed',
      message: `Error: ${errorMessage}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  resetForm() {
    this.currentStep = 1;
    this.basicInfoForm.reset();
    this.documentsForm.reset();
    this.vehicleForm.reset();
    this.insuranceForm.reset();

    // Reset form data
    this.formData = {
      basicInfo: {} as DriverInfoRequest,
      documents: {} as DocumentType,
      vehicle: {} as DriverVehicleInfo,
      insurance: {} as VehicleInsuranceInfo
    };

    // Set default status
    this.basicInfoForm.patchValue({ status: 'active' });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Document Upload';
      case 3: return 'Vehicle Information';
      case 4: return 'Insurance Information';
      case 5: return 'Review & Submit';
      default: return '';
    }
  }

  // Helper method to check if a field has errors
  hasError(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper method to get error message
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['min']) return `${fieldName.replace('_', ' ')} must be greater than 0`;
      if (field.errors['pattern']) {
        switch (fieldName) {
          case 'contact_num':
          case 'contact_num_addl':
            return 'Contact number must be 10 digits';
          case 'aadhar':
            return 'Aadhar number must be 12 digits';
          case 'pan':
            return 'PAN must be in format: AAAAA9999A';
          case 'ifsc':
            return 'IFSC code must be in format: AAAA0999999';
          case 'address_pin_code':
            return 'Pin code must be 6 digits';
          default:
            return 'Invalid format';
        }
      }
    }
    return '';
  }
}