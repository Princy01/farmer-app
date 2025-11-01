import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
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
  informationCircle, expand, trash, closeCircle
} from 'ionicons/icons';
import {
  DriverService,
  DriverInfoRequest,
  DriverDocumentRequest,
  DriverVehicle,
  DriverVehicleInsurance,
  DriverInfoResponse,
  DriverVehicleResponse,
  DriverDocumentResponse,
  DriverVehicleInsuranceResponse,
  State,
  City
} from './driver-registration.service';
import { AuthService } from 'src/app/auth/auth.service';
import { forkJoin, firstValueFrom } from 'rxjs';

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
  currentStep = 1;
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

  // Key IDs - driver_id is user_id
  driverId: number | null = null; // This is the user_id
  vehicleId: number | null = null;
  documentIds: Map<string, number> = new Map(); // doc_type -> document_id
  insuranceId: number | null = null;

  // Update mode flags
  isUpdateMode = false;
  existingData: {
    driverInfo: DriverInfoResponse | null;
    vehicles: DriverVehicleResponse[];
    documents: DriverDocumentResponse[];
    insurance: DriverVehicleInsuranceResponse[];
  } = {
      driverInfo: null,
      vehicles: [],
      documents: [],
      insurance: []
    };

  imagePreviewUrls: {
    aadhar_img: string | null;
    pan_img: string | null;
    driver_img: string | null;
    insurance_img: string | null;
    rc_img: string | null;
    license_img: string | null;
  } = {
      aadhar_img: null,
      pan_img: null,
      driver_img: null,
      insurance_img: null,
      rc_img: null,
      license_img: null
    };

  // Loading state
  isCheckingRegistration = true;
  isLoadingExistingData = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private driverService: DriverService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
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
      'information-circle': informationCircle,
      'trash': trash,
      'close-circle': closeCircle
    });
  }

  ngOnInit() {
    this.initializeForms();
    this.checkAuthAndInitialize();
  }

  ionViewWillEnter() {
    // Ionic lifecycle - called when entering the page
    console.log('Driver registration page entered');
  }

  ionViewDidEnter() {
    // Ionic lifecycle - called after page animation completes
    console.log('Driver registration page animation complete');
  }

  private async checkAuthAndInitialize() {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('driver')) {
      await this.showUnauthorizedError();
      return;
    }

    // Get user_id which is the driver_id
    this.driverId = this.authService.getUserId();
    if (!this.driverId) {
      await this.showAuthError();
      return;
    }

    console.log('Driver registration initialized for driver_id (user_id):', this.driverId);

    // Load states for dropdown
    this.loadStates();

    // Check registration status
    await this.checkDriverRegistrationStatus();
  }

  private async checkDriverRegistrationStatus() {
    const loading = await this.loadingController.create({
      message: 'Checking registration status...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });

    await loading.present();

    forkJoin({
      exists: this.driverService.checkDriverExists(),
      completed: this.driverService.checkDriverRegistrationCompleted()
    }).subscribe({
      next: async (result) => {
        await loading.dismiss();
        this.isCheckingRegistration = false;

        console.log('Registration check:', result);

        if (!result.exists) {
          // New registration - fresh start
          console.log('New driver registration');
          this.isUpdateMode = false;
          await this.showToast('Starting new driver registration', 'primary');
        } else if (result.completed) {
          // Registration already completed
          console.log('Driver registration already completed');
          this.router.navigate(['/transport/transport-dashboard']);
        } else {
          // Registration incomplete - load existing data
          console.log('Driver registration incomplete - resuming');
          this.isUpdateMode = true;
          await this.loadExistingData();
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.isCheckingRegistration = false;
        console.error('Error checking driver registration status:', error);
        await this.showToast('Could not verify registration status. Starting fresh.', 'warning');
        this.isUpdateMode = false;
      }
    });
  }

  private async loadExistingData() {
    if (!this.driverId) return;

    this.isLoadingExistingData = true;
    const loading = await this.loadingController.create({
      message: 'Loading your data...',
      spinner: 'circles',
      cssClass: 'custom-loading'
    });

    await loading.present();

    try {
      // Load all existing data in parallel
      const [driverInfo, vehicles, documents, insurance] = await Promise.all([
        firstValueFrom(this.driverService.getDriverInfo()),
        firstValueFrom(this.driverService.getDriverVehicles(this.driverId)),
        firstValueFrom(this.driverService.getDriverDocuments(this.driverId)),
        firstValueFrom(this.driverService.getDriverInsurance(this.driverId))
      ]);

      // Store existing data
      this.existingData.driverInfo = driverInfo;
      this.existingData.vehicles = vehicles || [];
      this.existingData.documents = documents || [];
      this.existingData.insurance = insurance || [];

      // Pre-fill forms with existing data
      if (driverInfo) {
        this.prefillDriverInfo(driverInfo);
      }

      if (vehicles && vehicles.length > 0) {
        this.vehicleId = vehicles[0].vehicle_id;
        this.prefillVehicleInfo(vehicles[0]);
      }

      if (documents && documents.length > 0) {
        this.prefillDocuments(documents);
      }

      if (insurance && insurance.length > 0) {
        this.insuranceId = insurance[0].insurance_id;
        this.prefillInsurance(insurance[0]);
      }

      await loading.dismiss();
      this.isLoadingExistingData = false;

      await this.showIncompleteRegistrationAlert();
    } catch (error) {
      await loading.dismiss();
      this.isLoadingExistingData = false;
      console.error('Error loading existing data:', error);
      await this.showToast('Could not load some existing data', 'warning');
    }
  }

  private prefillDriverInfo(data: DriverInfoResponse) {
    this.driverInfoForm.patchValue({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      dob: data.dob || '',
      licence_no: data.licence_no || '',
      licence_issued_date: data.licence_issued_date || '',
      licence_expiry_date: data.licence_expiry_date || '',
      licence_type: data.licence_type || '',
      address_door_no: data.address_door_no || '',
      address_street: data.address_street || '',
      address_town: data.address_town || '',
      address_state: data.address_state || '',
      address_pin_code: data.address_pin_code || '',
      address_landmark: data.address_landmark || '',
      contact_num: data.contact_num || '',
      contact_num_addl: data.contact_num_addl || '',
      email: data.email || '',
      aadhar: data.aadhar || '',
      pan: data.pan || '',
      bank_ac_no: data.bank_ac_no || '',
      bank_name: data.bank_name || '',
      bank_branch: data.bank_branch || '',
      ifsc: data.ifsc || '',
      bank_address: data.bank_address || '',
      status: data.status || 'active'
    });

    // Load cities if state is set
    if (data.address_state) {
      const state = this.states.find(s => s.state_shortname === data.address_state);
      if (state) {
        this.selectedStateId = state.id;
        this.driverService.getCitiesOfState(state.id).subscribe({
          next: (cities) => {
            this.cities = cities;
          }
        });
      }
    }
  }

  private prefillVehicleInfo(data: DriverVehicleResponse) {
    this.vehicleForm.patchValue({
      veh_number: data.veh_number || '',
      reg_date: data.reg_date || '',
      state: data.state || '',
      type_id: data.type_id || null,
      veh_make: data.veh_make || '',
      veh_model: data.veh_model || '',
      load_capacity: data.load_capacity || null,
      fuel_type: data.fuel_type || '',
      rc_document: data.rc_document || '',
      kms_travelled: data.kms_travelled || 0
    });
    console.log(this.vehicleForm.value)
  }



  // Update prefillDocuments to set preview URLs
  private prefillDocuments(documents: DriverDocumentResponse[]) {
    documents.forEach(doc => {
      const fieldMap: { [key: string]: string } = {
        'aadhar': 'aadhar_img',
        'pan': 'pan_img',
        'driver_image': 'driver_img',
        'insurance': 'insurance_img',
        'rc_document': 'rc_img',
        'license': 'license_img'
      };

      const fieldName = fieldMap[doc.doc_type];
      if (fieldName) {
        const base64Image = doc.doc_image;
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        this.documentsForm.patchValue({
          [fieldName]: base64Image
        });
        this.imagePreviewUrls[fieldName as keyof typeof this.imagePreviewUrls] = imageUrl;
        this.documentIds.set(doc.doc_type, doc.document_id);
      }
    });
  }

  private prefillInsurance(data: DriverVehicleInsuranceResponse) {
    this.insuranceForm.patchValue({
      frm_date: data.frm_date || '',
      to_date: data.to_date || '',
      ins_company: data.ins_company || '',
      amt_insured: data.amt_insured || null
    });
  }



  private async showIncompleteRegistrationAlert() {
    const alert = await this.alertController.create({
      header: 'Resume Registration',
      message: 'You have started the registration process. Your existing data has been loaded. Please complete all remaining steps.',
      buttons: [{
        text: 'Continue',
        cssClass: 'primary-button'
      }],
      backdropDismiss: false,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  private async showAuthError() {
    const alert = await this.alertController.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }],
      backdropDismiss: false,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertController.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page. Only drivers can register.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.router.navigate(['/login']);
        }
      }],
      backdropDismiss: false,
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  initializeForms() {
    // Step 1: Driver Basic Information
    this.driverInfoForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      dob: ['', [Validators.required]],
      licence_no: ['', [Validators.required, Validators.minLength(5)]],
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
      contact_num_addl: ['', [Validators.pattern(/^\d{10}$/)]],
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
      veh_number: ['', [Validators.required, Validators.minLength(5)]],
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
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    const currentForm = this.getCurrentForm();
    if (!currentForm) {
      await this.showToast('Form not found', 'danger');
      return;
    }

    // Validate form
    if (currentForm.invalid) {
      this.markFormGroupTouched(currentForm);
      const invalidFields = this.getInvalidFields(currentForm);
      const errorMessage = invalidFields.length > 0
        ? `Please fill the following fields correctly: ${invalidFields.join(', ')}`
        : 'Please fill all required fields correctly';
      await this.showToast(errorMessage, 'warning');
      return;
    }

    // Save current step data
    await this.saveCurrentStepData();
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
      case 4: return this.insuranceForm;
      default: return null;
    }
  }

  private getInvalidFields(formGroup: FormGroup): string[] {
    const invalidFields: string[] = [];
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control && control.invalid && control.errors?.['required']) {
        invalidFields.push(this.formatFieldName(key));
      }
    });
    return invalidFields;
  }

  async saveCurrentStepData() {
    const loading = await this.loadingController.create({
      message: 'Saving...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });

    await loading.present();

    try {
      switch (this.currentStep) {
        case 1:
          await this.saveDriverInfo(loading);
          break;
        case 2:
          await this.saveDocuments(loading);
          break;
        case 3:
          await this.saveVehicle(loading);
          break;
        case 4:
          await this.saveInsurance(loading);
          break;
        default:
          await loading.dismiss();
          break;
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error saving step data:', error);
      await this.showToast('An error occurred while saving', 'danger');
    }
  }

  async saveDriverInfo(loading: HTMLIonLoadingElement) {
    if (!this.driverId) {
      await loading.dismiss();
      await this.showToast('Driver ID not found', 'danger');
      return;
    }

    const formValue = this.driverInfoForm.value;
    const driverInfo: DriverInfoRequest = {
      first_name: formValue.first_name.trim(),
      last_name: formValue.last_name.trim(),
      dob: this.formatDate(formValue.dob),
      licence_no: formValue.licence_no.trim(),
      licence_issued_date: this.formatDate(formValue.licence_issued_date),
      licence_expiry_date: this.formatDate(formValue.licence_expiry_date),
      licence_type: formValue.licence_type,
      address_door_no: formValue.address_door_no?.trim() || '',
      address_street: formValue.address_street.trim(),
      address_town: formValue.address_town,
      address_state: formValue.address_state,
      address_pin_code: formValue.address_pin_code,
      address_landmark: formValue.address_landmark?.trim() || '',
      contact_num: formValue.contact_num,
      contact_num_addl: formValue.contact_num_addl || '',
      email: formValue.email?.trim() || '',
      aadhar: formValue.aadhar,
      pan: formValue.pan.toUpperCase().trim(),
      bank_ac_no: formValue.bank_ac_no.trim(),
      bank_name: formValue.bank_name.trim(),
      bank_branch: formValue.bank_branch.trim(),
      ifsc: formValue.ifsc.toUpperCase().trim(),
      bank_address: formValue.bank_address.trim(),
      status: formValue.status
    };

    // Decide whether to ADD or UPDATE
    const hasExistingData = this.isUpdateMode && this.existingData.driverInfo !== null;

    const request$ = hasExistingData
      ? this.driverService.updateDriverInfo(this.driverId, driverInfo)
      : this.driverService.addDriver(driverInfo);

    request$.subscribe({
      next: async (response) => {
        this.formData.driverInfo = driverInfo;
        await loading.dismiss();
        await this.showToast(
          hasExistingData ? 'Driver info updated successfully' : 'Driver info saved successfully',
          'success'
        );
        this.currentStep++;
      },
      error: async (error) => {
        await loading.dismiss();
        const errorMsg = error.error?.error || error.error?.message || 'Failed to save driver information';
        await this.showToast(errorMsg, 'danger');
        console.error('Driver info save error:', error);
      }
    });
  }

  async saveDocuments(loading: HTMLIonLoadingElement) {
    if (!this.driverId) {
      await loading.dismiss();
      await this.showToast('Driver ID not found. Please complete step 1 first.', 'danger');
      return;
    }

    const formValue = this.documentsForm.value;

    // Check if required documents are uploaded
    if (!formValue.rc_img || !formValue.license_img) {
      await loading.dismiss();
      await this.showToast('Please upload RC and License documents', 'warning');
      return;
    }

    const documents: DriverDocumentRequest = {
      driver_id: this.driverId,
      aadhar_img: formValue.aadhar_img || '',
      pan_img: formValue.pan_img || '',
      driver_img: formValue.driver_img || '',
      insurance_img: formValue.insurance_img || '',
      rc_img: formValue.rc_img,
      license_img: formValue.license_img
    };

    // For documents, we always use ADD (backend handles upsert logic)
    // Or if you want to update individual documents, you'd need to check each document type
    this.driverService.addDriverDocument(documents).subscribe({
      next: async (response) => {
        this.formData.documents = documents;
        await loading.dismiss();
        await this.showToast(response.message || 'Documents uploaded successfully', 'success');
        this.currentStep++;
      },
      error: async (error) => {
        await loading.dismiss();
        const errorMsg = error.error?.error || error.error?.message || 'Failed to upload documents';
        await this.showToast(errorMsg, 'danger');
        console.error('Documents upload error:', error);
      }
    });
  }

  async saveVehicle(loading: HTMLIonLoadingElement) {
    if (!this.driverId) {
      await loading.dismiss();
      await this.showToast('Driver ID not found. Please complete step 1 first.', 'danger');
      return;
    }

    const formValue = this.vehicleForm.value;
    const vehicle: DriverVehicle = {
      veh_number: formValue.veh_number.toUpperCase().trim(),
      reg_date: this.formatDate(formValue.reg_date),
      state: formValue.state,
      type_id: Number(formValue.type_id),
      veh_make: formValue.veh_make?.trim() || '',
      veh_model: formValue.veh_model?.trim() || '',
      driver_id: this.driverId,
      load_capacity: Number(formValue.load_capacity),
      fuel_type: formValue.fuel_type,
      rc_document: formValue.rc_document?.trim() || '',
      kms_travelled: Number(formValue.kms_travelled) || 0
    };

    // Decide whether to ADD or UPDATE
    const hasExistingVehicle = this.isUpdateMode && this.existingData.vehicles.length > 0;

    const request$ = hasExistingVehicle && this.vehicleId
      ? this.driverService.updateDriverVehicle(this.vehicleId, vehicle)
      : this.driverService.addDriverVehicle(vehicle);

    request$.subscribe({
      next: async (response: any) => {
        if (!hasExistingVehicle && response.vehicle_id) {
          this.vehicleId = response.vehicle_id;
        }
        this.formData.vehicle = vehicle;
        await loading.dismiss();
        await this.showToast(
          hasExistingVehicle ? 'Vehicle updated successfully' : 'Vehicle saved successfully',
          'success'
        );
        this.currentStep++;
      },
      error: async (error) => {
        await loading.dismiss();
        const errorMsg = error.error?.error || error.error?.message || 'Failed to save vehicle information';
        await this.showToast(errorMsg, 'danger');
        console.error('Vehicle save error:', error);
      }
    });
  }

  async saveInsurance(loading: HTMLIonLoadingElement) {
    if (!this.vehicleId || !this.driverId) {
      await loading.dismiss();
      await this.showToast('Vehicle ID not found. Please complete step 3 first.', 'danger');
      return;
    }

    const formValue = this.insuranceForm.value;

    // Check if insurance data is provided
    if (!formValue.frm_date || !formValue.to_date || !formValue.ins_company) {
      await loading.dismiss();
      await this.showToast('Please fill insurance details', 'warning');
      return;
    }

    const insurance: DriverVehicleInsurance = {
      vehicle_id: this.vehicleId,
      frm_date: this.formatDate(formValue.frm_date),
      to_date: this.formatDate(formValue.to_date),
      ins_company: formValue.ins_company,
      amt_insured: Number(formValue.amt_insured),
      driver_id: this.driverId
    };

    // Decide whether to ADD or UPDATE
    const hasExistingInsurance = this.isUpdateMode && this.existingData.insurance.length > 0;

    const request$ = hasExistingInsurance && this.insuranceId
      ? this.driverService.updateDriverVehicleInsurance(this.insuranceId, insurance)
      : this.driverService.addDriverVehicleInsurance(insurance);

    request$.subscribe({
      next: async () => {
        this.formData.insurance = insurance;
        await loading.dismiss();
        await this.showToast(
          hasExistingInsurance ? 'Insurance updated successfully' : 'Insurance saved successfully',
          'success'
        );
        // Registration complete
        await this.submitForm();
      },
      error: async (error) => {
        await loading.dismiss();
        const errorMsg = error.error?.error || error.error?.message || 'Failed to save insurance information';
        await this.showToast(errorMsg, 'danger');
        console.error('Insurance save error:', error);
      }
    });
  }

  async onFileSelected(event: any, fieldName: string) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      await this.showToast('File size should be less than 5MB', 'warning');
      event.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      await this.showToast('Please select an image file', 'warning');
      event.target.value = '';
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Uploading...',
      spinner: 'circles',
      cssClass: 'custom-loading'
    });

    await loading.present();

    try {
      // Create preview URL
      const previewUrl = await this.createImagePreview(file);
      this.imagePreviewUrls[fieldName as keyof typeof this.imagePreviewUrls] = previewUrl;

      // Convert to base64 for storage
      const base64 = await this.convertToBase64(file);
      this.documentsForm.patchValue({
        [fieldName]: base64
      });
      this.documentsForm.get(fieldName)?.markAsTouched();
      await loading.dismiss();
      await this.showToast(`${this.getDocumentLabel(fieldName)} uploaded`, 'success');
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Error uploading file', 'danger');
      event.target.value = '';
    }
  }

  createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = error => reject(error);
    });
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
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    await this.showSuccessAlert();
  }

  async showSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Registration Complete!',
      message: `Driver registered successfully!\n\nDriver ID: ${this.driverId}\nVehicle ID: ${this.vehicleId || 'N/A'}`,
      buttons: [{
        text: 'Go to Dashboard',
        cssClass: 'primary-button',
        handler: () => {
          this.router.navigate(['/transport/transport-dashboard']);
        }
      }],
      backdropDismiss: false,
      cssClass: 'success-alert'
    });
    await alert.present();
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      cssClass: 'custom-toast',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  getStepTitle(): string {
    const titles = [
      '',
      'Driver Information',
      'Document Upload',
      'Vehicle Details',
      'Insurance Details'
    ];
    return titles[this.currentStep] || '';
  }

  getStepIcon(): string {
    const icons = ['', 'person', 'document-text', 'car', 'shield'];
    return icons[this.currentStep] || '';
  }

  hasError(formGroup: FormGroup | null, fieldName: string): boolean {
    if (!formGroup) return false;
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getErrorMessage(formGroup: FormGroup | null, fieldName: string): string {
    if (!formGroup) return '';
    const field = formGroup.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (field.errors['email']) return 'Please enter a valid email';
    if (field.errors['minLength']) return `Minimum ${field.errors['minLength'].requiredLength} characters required`;
    if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}`;
    if (field.errors['pattern']) return this.getPatternError(fieldName);

    return 'Invalid input';
  }

  private getPatternError(fieldName: string): string {
    const patterns: { [key: string]: string } = {
      'contact_num': 'Contact number must be exactly 10 digits',
      'contact_num_addl': 'Contact number must be exactly 10 digits',
      'aadhar': 'Aadhar number must be exactly 12 digits',
      'pan': 'PAN must be in format: AAAAA9999A (e.g., ABCDE1234F)',
      'ifsc': 'IFSC code must be in format: AAAA0999999 (e.g., SBIN0001234)',
      'address_pin_code': 'Pin code must be exactly 6 digits'
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
      case 4: return this.formData.insurance;
      default: return {};
    }
  }

  onDateChange(event: any, controlName: string, formGroup: FormGroup | null) {
    if (!formGroup) return;
    formGroup.patchValue({
      [controlName]: event.detail.value
    });
  }

  loadStates() {
    this.driverService.getStates().subscribe({
      next: (states) => {
        this.states = states;
      },
      error: (error) => {
        console.error('Error loading states:', error);
        this.states = [];
        this.showToast('Failed to load states', 'warning');
      }
    });
  }

  onStateChange(event: any, formGroup: FormGroup | null, stateField: string, cityField: string) {
    if (!formGroup) return;

    const stateShortName = event.detail.value;
    const selectedState = this.states.find(s => s.state_shortname === stateShortName);

    if (selectedState) {
      this.selectedStateId = selectedState.id;
      this.driverService.getCitiesOfState(selectedState.id).subscribe({
        next: (cities) => {
          this.cities = cities;
          if (cities.length === 0) {
            this.showToast('No cities found for selected state', 'warning');
          }
        },
        error: (error) => {
          console.error('Error loading cities:', error);
          this.cities = [];
          this.showToast('Failed to load cities', 'warning');
        }
      });
      formGroup.patchValue({ [cityField]: '' }); // Reset city/town field
    } else {
      this.cities = [];
      formGroup.patchValue({ [cityField]: '' });
    }
  }

  // Helper methods for UI
  isStepComplete(step: number): boolean {
    switch (step) {
      case 1: return this.driverInfoForm.valid;
      case 2: return this.documentsForm.valid;
      case 3: return this.vehicleForm.valid;
      case 4: return this.insuranceForm.valid;
      default: return false;
    }
  }

  canNavigateToStep(step: number): boolean {
    // Can navigate to completed steps or current step
    for (let i = 1; i < step; i++) {
      if (!this.isStepComplete(i)) {
        return false;
      }
    }
    return true;
  }

  goToStep(step: number) {
    if (this.canNavigateToStep(step)) {
      this.currentStep = step;
    } else {
      this.showToast('Please complete previous steps first', 'warning');
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  isDocumentUploaded(fieldName: string): boolean {
    const value = this.documentsForm.get(fieldName)?.value;
    return !!value;
  }

  async clearDocument(fieldName: string) {
    const alert = await this.alertController.create({
      header: 'Clear Document',
      message: `Are you sure you want to clear ${this.getDocumentLabel(fieldName)}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Clear',
          cssClass: 'danger-button',
          handler: () => {
            this.documentsForm.patchValue({
              [fieldName]: ''
            });
            this.imagePreviewUrls[fieldName as keyof typeof this.imagePreviewUrls] = null;
            this.showToast(`${this.getDocumentLabel(fieldName)} cleared`, 'success');
          }
        }
      ],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }



  // Ionic lifecycle hooks
  ionViewWillLeave() {
    console.log('Leaving driver registration page');
  }

  ionViewDidLeave() {
    console.log('Left driver registration page');
  }
}