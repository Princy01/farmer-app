import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { person, car, shield, call, card, document, camera, cloudUpload, attach, eye, checkmarkCircle, close, warningOutline } from 'ionicons/icons';

export interface Driver {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  aadharNumber: string;
  aadharDocument?: File;
  panNumber?: string;
  panDocument?: File;
  licenseNumber: string;
  licenseType: string;
  licenseIssueDate: string;
  licenseExpiry: string;
  licenseDocument?: File;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  vehicleType: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleYear: number;
  vehicleColor: string;
  loadCapacity: number;
  rcNumber: string;
  rcDocument?: File;
  insuranceNumber: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  insuranceDocument?: File;
  pollutionCertificateNumber: string;
  pollutionExpiry: string;
  pollutionDocument?: File;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;
  experience: number;
  languagesKnown: string[];
  bankAccountNumber: string;
  bankDocument?: File;
  ifscCode: string;
  medicalCertificate: boolean;
  medicalDocument?: File;
  policeVerification: boolean;
  policeDocument?: File;
}

interface DocumentStatus {
  fileName: string;
  isVerified: boolean;
  sanitized: boolean;
  uploadDate: Date;
  fileUrl?: string;
}

@Component({
  selector: 'app-driver-registration',
  templateUrl: './driver-registration.component.html',
  styleUrls: ['./driver-registration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class DriverRegistrationPage {
  driverForm: FormGroup;
  isToastOpen = false;
  toastMessage = '';

  // Document upload status with verification and sanitization
  uploadedDocs: { [key: string]: DocumentStatus } = {};

  // Date properties for template use
  maxBirthDate: string;
  minExpiryDate: string;
  maxLicenseIssueDate: string;

  vehicleTypes = [
    'Two Wheeler (Motorcycle/Scooter)',
    'Three Wheeler (Auto-rickshaw)',
    'Light Motor Vehicle (Car/Jeep)',
    'Medium Goods Vehicle',
    'Heavy Goods Vehicle',
    'Passenger Vehicle (Bus)',
    'Taxi/Cab'
  ];

  licenseTypes = [
    'Learner License (LL)',
    'Permanent License (DL)',
    'Commercial License (CDL)',
    'Heavy Vehicle License (HMV)',
    'Transport License (TRAN)'
  ];

  indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
  ];

  genders = ['Male', 'Female', 'Other'];
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  relations = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Friend'];
  languages = ['Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu', 'Kannada', 'Malayalam', 'Punjabi', 'Assamese', 'Odia'];

  insuranceProviders = [
    'New India Assurance', 'National Insurance', 'Oriental Insurance', 'United India Insurance',
    'IFFCO Tokio', 'Bajaj Allianz', 'HDFC ERGO', 'ICICI Lombard', 'Tata AIG', 'Reliance General',
    'Bharti AXA', 'Future Generali', 'SBI General', 'Chola MS', 'Other'
  ];

  constructor(private formBuilder: FormBuilder) {
    addIcons({ person, car, shield, call, card, document, camera, cloudUpload, attach, eye, checkmarkCircle, close, warningOutline });

    // Set date constraints
    this.maxBirthDate = `${new Date().getFullYear() - 18}-12-31`;
    this.minExpiryDate = new Date().toISOString();
    this.maxLicenseIssueDate = new Date().toISOString().split('T')[0];

    this.driverForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      alternatePhone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      bloodGroup: [''],
      aadharNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      panNumber: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      licenseNumber: ['', [Validators.required, Validators.minLength(10)]],
      licenseType: ['', Validators.required],
      licenseIssueDate: ['', Validators.required],
      licenseExpiry: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      permanentAddress: ['', Validators.required],
      vehicleType: ['', Validators.required],
      vehicleModel: ['', Validators.required],
      vehiclePlate: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/)]],
      vehicleYear: ['', [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear() + 1)]],
      vehicleColor: ['', Validators.required],
      loadCapacity: ['', [Validators.required, Validators.min(0.1)]],
      rcNumber: ['', Validators.required],
      insuranceNumber: ['', Validators.required],
      insuranceProvider: ['', Validators.required],
      insuranceExpiry: ['', Validators.required],
      pollutionCertificateNumber: ['', Validators.required],
      pollutionExpiry: ['', Validators.required],
      emergencyContact: ['', Validators.required],
      emergencyPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      emergencyRelation: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(0)]],
      languagesKnown: [[], Validators.required],
      bankAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      medicalCertificate: [false, Validators.requiredTrue],
      policeVerification: [false, Validators.requiredTrue],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  async onFileUpload(event: any, documentType: string) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        this.showToast('Please upload only PDF files');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File size should be less than 5MB');
        return;
      }

      // Show sanitization process
      this.showToast('Sanitizing document...');

      // Simulate document sanitization
      const sanitizationResult = await this.sanitizeDocument(file);

      if (sanitizationResult.success) {
        // Create URL for file viewing
        const fileUrl = URL.createObjectURL(file);

        this.uploadedDocs[documentType] = {
          fileName: file.name,
          isVerified: false, // Will be verified after backend processing
          sanitized: true,
          uploadDate: new Date(),
          fileUrl: fileUrl
        };

        this.showToast(`${documentType} uploaded and sanitized successfully`);

        // Simulate verification process (would be done on backend)
        setTimeout(() => {
          this.verifyDocument(documentType);
        }, 2000);

        console.log(`Uploading ${documentType}:`, file);
      } else {
        this.showToast(`Document sanitization failed: ${sanitizationResult.error}`);
      }
    }
  }

  private async sanitizeDocument(file: File): Promise<{success: boolean, error?: string}> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate sanitization checks
        const checks = [
          'Checking file integrity...',
          'Scanning for malware...',
          'Removing metadata...',
          'Validating PDF structure...'
        ];

        // Simulate some checks
        const hasVirus = Math.random() < 0.05; // 5% chance of virus (simulation)
        const isCorrupted = Math.random() < 0.03; // 3% chance of corruption (simulation)

        if (hasVirus) {
          resolve({ success: false, error: 'Malicious content detected' });
        } else if (isCorrupted) {
          resolve({ success: false, error: 'File is corrupted or invalid' });
        } else {
          resolve({ success: true });
        }
      }, 1500); // Simulate processing time
    });
  }

  private verifyDocument(documentType: string) {
    if (this.uploadedDocs[documentType]) {
      // Simulate verification process
      const isValid = Math.random() < 0.9; // 90% success rate for simulation

      this.uploadedDocs[documentType].isVerified = isValid;

      if (isValid) {
        this.showToast(`${documentType} verified successfully`);
      } else {
        this.showToast(`${documentType} verification failed - please upload a clearer document`);
      }
    }
  }

  viewDocument(documentType: string) {
    const doc = this.uploadedDocs[documentType];
    if (doc && doc.fileUrl) {
      // Open document in new window/tab
      window.open(doc.fileUrl, '_blank');
    } else {
      this.showToast('Document not available for viewing');
    }
  }

  removeDocument(documentType: string) {
    if (this.uploadedDocs[documentType]?.fileUrl) {
      URL.revokeObjectURL(this.uploadedDocs[documentType].fileUrl!);
    }
    delete this.uploadedDocs[documentType];
    this.showToast(`${documentType} removed`);
  }

  onSubmit() {
    if (this.driverForm.valid) {
      const driverData: Driver = this.driverForm.value;
      console.log('Driver Registration Data:', driverData);
      console.log('Uploaded Documents:', this.uploadedDocs);
      this.showToast('Registration submitted successfully!');
    } else {
      this.showToast('Please fill in all required fields correctly.');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.driverForm.controls).forEach(key => {
      this.driverForm.get(key)?.markAsTouched();
    });
  }

  private showToast(message: string) {
    this.toastMessage = message;
    this.isToastOpen = true;
  }

  setToastOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.driverForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `${fieldName} is too short`;
      if (control.errors['pattern']) {
        if (fieldName === 'aadharNumber') return 'Aadhar number must be 12 digits';
        if (fieldName === 'phone' || fieldName === 'alternatePhone' || fieldName === 'emergencyPhone') return 'Enter valid Indian mobile number';
        if (fieldName === 'panNumber') return 'Enter valid PAN format (e.g., ABCDE1234F)';
        if (fieldName === 'pinCode') return 'PIN code must be 6 digits';
        if (fieldName === 'vehiclePlate') return 'Enter valid vehicle number format';
        if (fieldName === 'bankAccountNumber') return 'Account number must be 9-18 digits';
        if (fieldName === 'ifscCode') return 'Enter valid IFSC code';
        return `${fieldName} format is invalid`;
      }
      if (control.errors['min']) return `${fieldName} value is too low`;
      if (control.errors['max']) return `${fieldName} value is too high`;
    }
    return '';
  }
}