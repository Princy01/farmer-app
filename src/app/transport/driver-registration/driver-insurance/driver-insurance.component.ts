import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DriverInsuranceService, DriverInsuranceRequest } from './driver-insurance.service';
import { DriverInsurance } from '../models/driver.models';

@Component({
  selector: 'app-driver-insurance',
  templateUrl: './driver-insurance.component.html',
  styleUrls: ['./driver-insurance.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class DriverInsuranceComponent implements OnInit {
  insuranceForm!: FormGroup;
  isSubmitting = false;
  uploadedFiles: { [key: string]: File } = {};

  minFromDate: string;
  registeredVehicles: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private insuranceService: DriverInsuranceService,
    private toastController: ToastController
  ) {
    this.minFromDate = new Date().toISOString().split('T')[0];
  }

  // Get data from service instead of component properties
  get insuranceCompanies() {
    return this.insuranceService.insuranceCompanies;
  }

  ngOnInit() {
    this.loadRegisteredVehicles();
    this.initializeForm();
    this.loadExistingData();
    this.addInsurance(); // Add first insurance by default
  }

  loadRegisteredVehicles() {
    const registrationData = this.insuranceService.getRegistrationData();
    this.registeredVehicles = registrationData.vehicles || [];
  }

  initializeForm() {
    this.insuranceForm = this.formBuilder.group({
      insurances: this.formBuilder.array([])
    });
  }

  get insurancesArray(): FormArray {
    return this.insuranceForm.get('insurances') as FormArray;
  }

  createInsuranceFormGroup(): FormGroup {
    return this.formBuilder.group({
      vehicle_id: ['', Validators.required],
      frm_date: ['', Validators.required],
      to_date: ['', Validators.required],
      insurance_company: ['', Validators.required], // Frontend field name
      insured_amount: ['', [Validators.required, Validators.min(1000)]], // Frontend field name
      ins_document: [null]
    });
  }

  addInsurance() {
    this.insurancesArray.push(this.createInsuranceFormGroup());
  }

  removeInsurance(index: number) {
    // Remove uploaded file if exists
    const fileKey = `insurance_${index}`;
    if (this.uploadedFiles[fileKey]) {
      delete this.uploadedFiles[fileKey];
    }

    this.insurancesArray.removeAt(index);

    // Reindex uploaded files
    this.reindexUploadedFiles();
  }

  private reindexUploadedFiles() {
    const newUploadedFiles: { [key: string]: File } = {};
    Object.keys(this.uploadedFiles).forEach(key => {
      if (key.startsWith('insurance_')) {
        const oldIndex = parseInt(key.split('_')[1]);
        const newIndex = oldIndex > this.insurancesArray.length ? oldIndex - 1 : oldIndex;
        if (newIndex < this.insurancesArray.length) {
          newUploadedFiles[`insurance_${newIndex}`] = this.uploadedFiles[key];
        }
      }
    });
    this.uploadedFiles = newUploadedFiles;
  }

  onFileUpload(event: any, index: number) {
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

      this.uploadedFiles[`insurance_${index}`] = file;

      // Update form control
      const insuranceControl = this.insurancesArray.at(index);
      insuranceControl.patchValue({ ins_document: file });
    }
  }

  getFileName(index: number): string {
    return this.uploadedFiles[`insurance_${index}`]?.name || 'No file selected';
  }

  hasFile(index: number): boolean {
    return !!this.uploadedFiles[`insurance_${index}`];
  }

  getVehicleDisplay(vehicleId: string): string {
    const vehicle = this.registeredVehicles.find(v => v.veh_number === vehicleId);
    return vehicle ? `${vehicle.veh_number} - ${vehicle.make} ${vehicle.model}` : vehicleId;
  }

  // Helper method to get vehicle ID for backend (convert from veh_number to vehicle_id)
  getVehicleIdForBackend(vehNumber: string): number | null {
    const registrationData = this.insuranceService.getRegistrationData();
    const vehicle = registrationData.vehicles.find(v => v.veh_number === vehNumber);
    return vehicle && vehicle.vehicle_id ? parseInt(vehicle.vehicle_id.toString()) : null;
  }

  onFromDateChange(index: number) {
    const fromDate = this.insurancesArray.at(index).get('frm_date')?.value;
    if (fromDate) {
      const minToDate = new Date(fromDate);
      minToDate.setDate(minToDate.getDate() + 1);

      const toDateControl = this.insurancesArray.at(index).get('to_date');
      const currentToDate = toDateControl?.value;

      if (currentToDate && new Date(currentToDate) <= new Date(fromDate)) {
        toDateControl?.setValue('');
      }
    }
  }

  getMinToDate(index: number): string {
    const fromDate = this.insurancesArray.at(index).get('frm_date')?.value;
    if (fromDate) {
      const minDate = new Date(fromDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate.toISOString().split('T')[0];
    }
    return this.minFromDate;
  }

  loadExistingData() {
    const registrationData = this.insuranceService.getRegistrationData();
    if (registrationData.insurance && registrationData.insurance.length > 0) {
      // Clear existing form array
      while (this.insurancesArray.length) {
        this.insurancesArray.removeAt(0);
      }

      // Add insurances from saved data
      registrationData.insurance.forEach(insurance => {
        const insuranceGroup = this.createInsuranceFormGroup();
        insuranceGroup.patchValue(insurance);
        this.insurancesArray.push(insuranceGroup);
      });
    }
  }

  onPrevious() {
    this.router.navigate(['/transport/driver-registration/vehicles']);
  }

  async onSaveAndNext() {
    if (this.insuranceForm.valid && this.insurancesArray.length > 0) {
      this.isSubmitting = true;

      try {
        // Get driver_id from registration data
        const registrationData = this.insuranceService.getRegistrationData();
        const driverId = registrationData.driverInfo.driver_id;

        if (!driverId) {
          throw new Error('Driver ID not found. Please complete basic information first.');
        }

        // Submit each insurance to backend
        for (let i = 0; i < this.insurancesArray.length; i++) {
          const insuranceForm = this.insurancesArray.at(i);

          // Get vehicle ID for backend
          const vehicleId = this.getVehicleIdForBackend(insuranceForm.value.vehicle_id);
          if (!vehicleId) {
            throw new Error(`Vehicle ID not found for vehicle: ${insuranceForm.value.vehicle_id}`);
          }

          // Prepare insurance data for backend
          const insuranceData: DriverInsuranceRequest = {
            vehicle_id: vehicleId, // Convert to number
            frm_date: insuranceForm.value.frm_date,
            to_date: insuranceForm.value.to_date,
            ins_company: insuranceForm.value.insurance_company, // Map field name
            amt_insured: parseFloat(insuranceForm.value.insured_amount), // Convert to number and map field name
            driver_id: parseInt(driverId.toString()) // Convert to number
          };

          await this.insuranceService.addDriverInsurance(insuranceData).toPromise();
        }

        // Show success message
        const toast = await this.toastController.create({
          message: 'Insurance information saved successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Update local registration service for next steps
        const insurances: DriverInsurance[] = this.insurancesArray.value.map((insurance: any, index: number) => {
          const insuranceData: DriverInsurance = {
            vehicle_id: insurance.vehicle_id,
            frm_date: insurance.frm_date,
            to_date: insurance.to_date,
            insurance_company: insurance.insurance_company,
            insured_amount: insurance.insured_amount
          };

          if (this.uploadedFiles[`insurance_${index}`]) {
            insuranceData.ins_document = this.uploadedFiles[`insurance_${index}`];
          }

          return insuranceData;
        });

        this.insuranceService.updateInsurance(insurances);
        this.insuranceService.setCurrentStep(5);

        // Navigate to next step
        this.router.navigate(['/transport/driver-registration/review']);

      } catch (error: any) {
        console.error('Failed to save insurance info:', error);

        const toast = await this.toastController.create({
          message: error.message || 'Failed to save insurance information. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      if (this.insurancesArray.length === 0) {
        alert('Please add at least one insurance record');
      }
    }
  }

  private markFormGroupTouched() {
    this.insurancesArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  getErrorMessage(fieldName: string, index: number): string {
    const control = this.insurancesArray.at(index).get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (control.errors['min']) {
        if (fieldName === 'insured_amount') return 'Insured amount must be at least ₹1,000';
        return `${fieldName.replace('_', ' ')} must be greater than 0`;
      }
    }
    return '';
  }
}