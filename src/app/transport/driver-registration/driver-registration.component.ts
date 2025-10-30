import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chevronForward,
  chevronBack,
  checkmarkCircle,
  cloudUpload,
  documentText,
  car,
  shield,
  person,
  call,
  mail,
  card,
  business,
  location,
  calendar,
  informationCircle
} from 'ionicons/icons';
import {
  DriverService,
  DriverInfoRequest,
  DriverDocumentRequest,
  DriverVehicle,
  DriverVehicleInsurance,
  State,
  City
} from './driver-registration.service';

interface FormData {
  driverInfo: Partial<DriverInfoRequest>;
  documents: Partial<DriverDocumentRequest>;
  vehicle: Partial<DriverVehicle>;
  insurance: Partial<DriverVehicleInsurance>;
}

@Component({
  selector: 'app-driver-registration',
  templateUrl: './driver-registration.component.html',
  styleUrls: ['./driver-registration.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class DriverRegistrationComponent implements OnInit {
  currentStep = 4;
  totalSteps = 4;
  today = new Date().toISOString();
  states: State[] = [];
  cities: City[] = [];
  selectedStateId: number | null = null;

  // Form groups
  driverInfoForm!: FormGroup;
  documentsForm!: FormGroup;
  vehicleForm!: FormGroup;
  insuranceForm!: FormGroup;

  // Stored form data
  formData: FormData = {
    driverInfo: {},
    documents: {},
    vehicle: {},
    insurance: {}
  };

  // Store IDs after creation
  driverId: number | null = null;
  vehicleId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private driverService: DriverService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Register icons
    addIcons({
      'chevron-forward': chevronForward,
      'chevron-back': chevronBack,
      'checkmark-circle': checkmarkCircle,
      'cloud-upload': cloudUpload,
      'document-text': documentText,
      'car': car,
      'shield': shield,
      'person': person,
      'call': call,
      'mail': mail,
      'card': card,
      'business': business,
      'location': location,
      'calendar': calendar,
      'information-circle': informationCircle
    });
  }

  ngOnInit() {
    this.initializeForms();
    this.loadStates();
  }

  initializeForms() {
    // Step 1: Driver Basic Information
    this.driverInfoForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      dob: ['', [Validators.required]],
      licence_no: ['', [Validators.required]],
      licence_issued_date: ['', [Validators.required]],
      licence_expiry_date: ['', [Validators.required]],
      licence_type: ['', [Validators.required]],
      address_door_no: [''],
      address_street: ['', [Validators.required]],
      address_town: ['', [Validators.required]],
      address_state: ['', [Validators.required]],
      address_pin_code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      address_landmark: [''],
      contact_num: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contact_num_addl: [''],
      email: ['', [Validators.email]],
      aadhar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      pan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      bank_ac_no: ['', [Validators.required]],
      bank_name: ['', [Validators.required]],
      bank_branch: ['', [Validators.required]],
      ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bank_address: ['', [Validators.required]],
      status: ['active', [Validators.required]]
    });

    // Step 2: Documents
    this.documentsForm = this.fb.group({
      aadhar_img: [''],
      pan_img: [''],
      driver_img: [''],
      insurance_img: [''],
      rc_img: ['', [Validators.required]],
      license_img: ['', [Validators.required]]
    });
    // Step 3: Vehicle Information
    this.vehicleForm = this.fb.group({
      veh_number: ['', [Validators.required]],
      reg_date: ['', [Validators.required]],
      state: ['', [Validators.required]],
      type_id: [null, [Validators.required]],
      veh_make: [''],
      veh_model: [''],
      load_capacity: [null, [Validators.required, Validators.min(1)]],
      fuel_type: ['', [Validators.required]],
      rc_document: [''],
      kms_travelled: [0]
    });

    // Step 4: Insurance Information
    this.insuranceForm = this.fb.group({
      frm_date: [''],
      to_date: [''],
      ins_company: [''],
      amt_insured: [null]
    });
  }

  async nextStep() {
    const currentForm = this.getCurrentForm();

    if (currentForm && currentForm.invalid) {
      await this.showToast('Please fill all required fields correctly', 'warning');
      this.markFormGroupTouched(currentForm);
      return;
    }

    // Save current step data and proceed
    this.saveCurrentStepData();
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  getCurrentForm(): FormGroup | null {
    switch (this.currentStep) {
      case 1: return this.driverInfoForm;
      case 2: return this.documentsForm;
      case 3: return this.vehicleForm;
      // case 4: return this.insuranceForm;
      default: return null;
    }
  }

  async saveCurrentStepData() {
    const loading = await this.loadingController.create({
      message: 'Saving...',
      spinner: 'crescent'
    });

    await loading.present();

    switch (this.currentStep) {
      case 1:
        this.saveDriverInfo(loading);
        break;
      case 2:
        if (this.hasDocuments()) {
          this.saveDocuments(loading);
        } else {
          await loading.dismiss();
          this.currentStep++;
        }
        break;
      case 3:
        this.saveVehicle(loading);
        break;
      // case 4:
      //   this.saveInsurance(loading);
      //   break;
      default:
        await loading.dismiss();
        break;
    }
  }

  saveDriverInfo(loading: HTMLIonLoadingElement) {
    const formValue = this.driverInfoForm.value;

    const driverInfo: DriverInfoRequest = {
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      dob: this.formatDate(formValue.dob),
      licence_no: formValue.licence_no,
      licence_issued_date: this.formatDate(formValue.licence_issued_date),
      licence_expiry_date: this.formatDate(formValue.licence_expiry_date),
      licence_type: formValue.licence_type,
      address_door_no: formValue.address_door_no || '',
      address_street: formValue.address_street,
      address_town: formValue.address_town,
      address_state: formValue.address_state,
      address_pin_code: formValue.address_pin_code,
      address_landmark: formValue.address_landmark || '',
      contact_num: formValue.contact_num,
      contact_num_addl: formValue.contact_num_addl || '',
      email: formValue.email || '',
      aadhar: formValue.aadhar,
      pan: formValue.pan.toUpperCase(),
      bank_ac_no: formValue.bank_ac_no || '',
      bank_name: formValue.bank_name || '',
      bank_branch: formValue.bank_branch || '',
      ifsc: formValue.ifsc ? formValue.ifsc.toUpperCase() : '',
      bank_address: formValue.bank_address || '',
      status: formValue.status
    };

    this.driverService.addDriver(driverInfo).subscribe({
      next: (response) => {
        this.driverId = response.driver_id;
        this.formData.driverInfo = driverInfo;
        loading.dismiss();
        this.showToast('Driver information saved successfully', 'success');
        this.currentStep++;
      },
      error: (error) => {
        loading.dismiss();
        const errorMsg = error.error?.error || 'Failed to save driver information';
        this.showToast(errorMsg, 'danger');
      }
    });
  }

  saveDocuments(loading: HTMLIonLoadingElement) {
    if (!this.driverId) {
      loading.dismiss();
      this.showToast('Driver ID not found. Please complete step 1 first.', 'danger');
      return;
    }

    const formValue = this.documentsForm.value;
    const documents: DriverDocumentRequest = {
      driver_id: this.driverId,
      aadhar_img: formValue.aadhar_img || '',
      pan_img: formValue.pan_img || '',
      driver_img: formValue.driver_img || '',
      insurance_img: formValue.insurance_img || '',
      rc_img: formValue.rc_img,
      license_img: formValue.license_img
    };

    this.driverService.addDriverDocument(documents).subscribe({
      next: (response) => {
        this.formData.documents = documents;
        loading.dismiss();
        this.showToast(response.message || 'Documents uploaded successfully', 'success');
        this.currentStep++;
      },
      error: (error) => {
        loading.dismiss();
        const errorMsg = error.error?.error || 'Failed to upload documents';
        this.showToast(errorMsg, 'warning');
        // Don't block progression - documents are optional
        this.currentStep++;
      }
    });
  }

  saveVehicle(loading: HTMLIonLoadingElement) {
    if (!this.driverId) {
      loading.dismiss();
      this.showToast('Driver ID not found. Please complete step 1 first.', 'danger');
      return;
    }

    const formValue = this.vehicleForm.value;
    const vehicle: DriverVehicle = {
      veh_number: formValue.veh_number.toUpperCase(),
      reg_date: this.formatDate(formValue.reg_date),
      state: formValue.state,
      type_id: Number(formValue.type_id),
      veh_make: formValue.veh_make,
      veh_model: formValue.veh_model,
      driver_id: this.driverId,
      load_capacity: Number(formValue.load_capacity),
      fuel_type: formValue.fuel_type,
      rc_document: formValue.rc_document || '',
      kms_travelled: Number(formValue.kms_travelled) || 0
    };

    this.driverService.addDriverVehicle(vehicle).subscribe({
      next: (response) => {
        this.vehicleId = response.vehicle_id;
        this.formData.vehicle = vehicle;
        loading.dismiss();
        this.showToast('Vehicle information saved successfully', 'success');
        this.currentStep++;
      },
      error: (error) => {
        loading.dismiss();
        const errorMsg = error.error?.error || 'Failed to save vehicle information';
        this.showToast(errorMsg, 'danger');
      }
    });
  }

  saveInsurance(loading: HTMLIonLoadingElement) {
    if (!this.vehicleId || !this.driverId) {
      loading.dismiss();
      this.showToast('Vehicle ID not found. Please complete step 3 first.', 'danger');
      return;
    }

    const formValue = this.insuranceForm.value;
    const insurance: DriverVehicleInsurance = {
      vehicle_id: this.vehicleId,
      frm_date: this.formatDate(formValue.frm_date),
      to_date: this.formatDate(formValue.to_date),
      ins_company: formValue.ins_company,
      amt_insured: Number(formValue.amt_insured),
      driver_id: this.driverId
    };

    this.driverService.addDriverVehicleInsurance(insurance).subscribe({
      next: () => {
        this.formData.insurance = insurance;
        loading.dismiss();
        this.showToast('Insurance information saved successfully', 'success');
        this.currentStep++;
      },
      error: (error) => {
        loading.dismiss();
        const errorMsg = error.error?.error || 'Failed to save insurance information';
        this.showToast(errorMsg, 'danger');
      }
    });
  }

  async onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

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
      await this.showToast(`${this.getDocumentLabel(fieldName)} uploaded`, 'success');
    } catch (error) {
      await this.showToast('Error uploading file', 'danger');
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async submitForm() {
    await this.showSuccessAlert();
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Registration Complete!',
      message: `
        Driver registered successfully!<br><br>
        <strong>Driver ID:</strong> ${this.driverId}<br>
        <strong>Vehicle ID:</strong> ${this.vehicleId || 'N/A'}<br>
      `,
      buttons: [{
        text: 'OK',
        handler: () => {
          this.resetForm();
        }
      }]
    });
    await alert.present();
  }

  resetForm() {
    this.currentStep = 1;
    this.driverId = null;
    this.vehicleId = null;

    this.driverInfoForm.reset({ status: 'active' });
    this.documentsForm.reset();
    this.vehicleForm.reset();
    this.insuranceForm.reset();

    this.formData = {
      driverInfo: {},
      documents: {},
      vehicle: {},
      insurance: {}
    };
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
      position: 'top',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  getStepTitle(): string {
    const titles = [
      '',
      'Driver Information',
      'Document Upload',
      'Vehicle Details',
      // 'Insurance Information',
      'Review & Submit'
    ];
    return titles[this.currentStep] || '';
  }

  getStepIcon(): string {
    const icons = ['', 'person', 'document-text', 'car', 'shield', 'checkmark-circle'];
    return icons[this.currentStep] || '';
  }

  hasError(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['min']) return `Value must be greater than ${field.errors['min'].min}`;
    if (field.errors['pattern']) {
      return this.getPatternError(fieldName);
    }
    return 'Invalid input';
  }

  private getPatternError(fieldName: string): string {
    const patterns: { [key: string]: string } = {
      'contact_num': 'Contact number must be 10 digits',
      'contact_num_addl': 'Contact number must be 10 digits',
      'aadhar': 'Aadhar number must be 12 digits',
      'pan': 'PAN must be in format: AAAAA9999A',
      'ifsc': 'IFSC code must be in format: AAAA0999999',
      'address_pin_code': 'Pin code must be 6 digits'
    };
    return patterns[fieldName] || 'Invalid format';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  private hasDocuments(): boolean {
    const formValue = this.documentsForm.value;
    return Object.values(formValue).some(value => value !== '');
  }

  private getDocumentLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'aadhar_img': 'Aadhar Document',
      'pan_img': 'PAN Document',
      'driver_img': 'Driver Photo',
      'insurance_img': 'Insurance Document',
      'rc_img': 'RC Document',
      'license_img': 'License Document'
    };
    return labels[fieldName] || 'Document';
  }

  getFormValue(step: number): any {
    switch (step) {
      case 1: return this.formData.driverInfo;
      case 2: return this.formData.documents;
      case 3: return this.formData.vehicle;
      // case 4: return this.formData.insurance;
      default: return {};
    }
  }

  onDateChange(event: any, controlName: string, formGroup: FormGroup) {
    formGroup.patchValue({
      [controlName]: event.detail.value
    });
  }

  loadStates() {
    this.driverService.getStates().subscribe({
      next: (states) => { this.states = states; },
      error: () => { this.states = []; }
    });
  }

  onStateChange(event: any, formGroup: FormGroup, stateField: string, cityField: string) {
    const stateShortName = event.detail.value;
    const selectedState = this.states.find(s => s.state_shortname === stateShortName);
    if (selectedState) {
      this.selectedStateId = selectedState.id;
      this.driverService.getCitiesOfState(selectedState.id).subscribe({
        next: (cities) => { this.cities = cities; },
        error: () => { this.cities = []; }
      });
      formGroup.patchValue({ [cityField]: '' }); // Reset city/town field
    } else {
      this.cities = [];
      formGroup.patchValue({ [cityField]: '' });
    }
  }
}