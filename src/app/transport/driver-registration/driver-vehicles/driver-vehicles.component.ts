import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DriverVehicleService, DriverVehicleRequest } from './driver-vehicles.service';
import { DriverVehicle } from '../models/driver.models';

@Component({
  selector: 'app-driver-vehicles',
  templateUrl: './driver-vehicles.component.html',
  styleUrls: ['./driver-vehicles.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class DriverVehiclesComponent implements OnInit {
  vehiclesForm!: FormGroup;
  isSubmitting = false;
  uploadedFiles: { [key: string]: File } = {};
  maxRegistrationDate: string;
  indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private vehicleService: DriverVehicleService,
    private toastController: ToastController
  ) {
    this.maxRegistrationDate = new Date().toISOString().split('T')[0];
  }

  get vehicleTypes() {
    return this.vehicleService.vehicleTypes;
  }

  get fuelTypes() {
    return this.vehicleService.fuelTypes;
  }

  get vehicleMakes() {
    return this.vehicleService.vehicleMakes;
  }

  ngOnInit() {
    this.initializeForm();
    this.loadExistingData();
    this.addVehicle();
  }

  initializeForm() {
    this.vehiclesForm = this.formBuilder.group({
      vehicles: this.formBuilder.array([])
    });
  }

  get vehiclesArray(): FormArray {
    return this.vehiclesForm.get('vehicles') as FormArray;
  }

  createVehicleFormGroup(): FormGroup {
    return this.formBuilder.group({
      veh_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{1,4}$/)]],
      reg_date: ['', Validators.required],
      state: ['', Validators.required],
      type_id: ['', Validators.required],
      veh_make: ['', Validators.required],
      veh_model: ['', Validators.required],
      load_capacity: ['', [Validators.required, Validators.min(1)]],
      fuel_type: ['', Validators.required],
      kms_travelled: ['', [Validators.required, Validators.min(0)]],
      rc_document: [null]
    });
  }

  addVehicle() {
    this.vehiclesArray.push(this.createVehicleFormGroup());
  }

  removeVehicle(index: number) {
    const fileKey = `rc_${index}`;
    if (this.uploadedFiles[fileKey]) {
      delete this.uploadedFiles[fileKey];
    }
    this.vehiclesArray.removeAt(index);
    this.reindexUploadedFiles();
  }

  private reindexUploadedFiles() {
    const newUploadedFiles: { [key: string]: File } = {};
    Object.keys(this.uploadedFiles).forEach(key => {
      if (key.startsWith('rc_')) {
        const oldIndex = parseInt(key.split('_')[1]);
        const newIndex = oldIndex > this.vehiclesArray.length ? oldIndex - 1 : oldIndex;
        if (newIndex < this.vehiclesArray.length) {
          newUploadedFiles[`rc_${newIndex}`] = this.uploadedFiles[key];
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

      this.uploadedFiles[`rc_${index}`] = file;
      const vehicleControl = this.vehiclesArray.at(index);
      vehicleControl.patchValue({ rc_document: file });
    }
  }

  getFileName(index: number): string {
    return this.uploadedFiles[`rc_${index}`]?.name || 'No file selected';
  }

  hasFile(index: number): boolean {
    return !!this.uploadedFiles[`rc_${index}`];
  }

  getVehicleTypeName(typeId: string): string {
    const vehicleType = this.vehicleTypes.find(type => type.type_id === typeId);
    return vehicleType ? vehicleType.type_name : '';
  }

  loadExistingData() {
    const registrationData = this.vehicleService.getRegistrationData();
    if (registrationData.vehicles && registrationData.vehicles.length > 0) {
      while (this.vehiclesArray.length) {
        this.vehiclesArray.removeAt(0);
      }

      registrationData.vehicles.forEach(vehicle => {
        const vehicleGroup = this.createVehicleFormGroup();
        vehicleGroup.patchValue({
          veh_number: vehicle.veh_number,
          reg_date: vehicle.registered_date,
          state: vehicle.state,
          type_id: vehicle.type_id,
          veh_make: vehicle.make,
          veh_model: vehicle.model,
          load_capacity: vehicle.load_capacity,
          fuel_type: vehicle.fuel_type,
          kms_travelled: vehicle.kms_travelled
        });
        this.vehiclesArray.push(vehicleGroup);
      });
    }
  }

  onPrevious() {
    this.router.navigate(['/transport/driver-registration/documents']);
  }

  async onSaveAndNext() {
    if (this.vehiclesForm.valid && this.vehiclesArray.length > 0) {
      this.isSubmitting = true;

      try {
        const registrationData = this.vehicleService.getRegistrationData();
        const driverId = registrationData.driverInfo.driver_id;

        if (!driverId) {
          throw new Error('Driver ID not found. Please complete basic information first.');
        }

        const vehiclesWithIds: DriverVehicle[] = [];

        for (let i = 0; i < this.vehiclesArray.length; i++) {
          const vehicleForm = this.vehiclesArray.at(i);
          const vehicleData: DriverVehicleRequest = {
            veh_number: vehicleForm.value.veh_number,
            reg_date: vehicleForm.value.reg_date,
            state: vehicleForm.value.state,
            type_id: parseInt(vehicleForm.value.type_id),
            veh_make: vehicleForm.value.veh_make,
            veh_model: vehicleForm.value.veh_model,
            driver_id: parseInt(driverId.toString()),
            load_capacity: parseInt(vehicleForm.value.load_capacity),
            fuel_type: vehicleForm.value.fuel_type,
            rc_document: this.uploadedFiles[`rc_${i}`] ? this.uploadedFiles[`rc_${i}`].name : '',
            kms_travelled: parseFloat(vehicleForm.value.kms_travelled)
          };

          const response = await this.vehicleService.addDriverVehicle(vehicleData).toPromise();

          const localVehicleData: DriverVehicle = {
            veh_number: vehicleForm.value.veh_number,
            registered_date: vehicleForm.value.reg_date,
            state: vehicleForm.value.state,
            type_id: vehicleForm.value.type_id,
            make: vehicleForm.value.veh_make,
            model: vehicleForm.value.veh_model,
            load_capacity: vehicleForm.value.load_capacity,
            fuel_type: vehicleForm.value.fuel_type,
            kms_travelled: vehicleForm.value.kms_travelled
          };

          if (response && response.vehicle_id) {
            localVehicleData.vehicle_id = response.vehicle_id;
          }

          if (this.uploadedFiles[`rc_${i}`]) {
            localVehicleData.rc_document = this.uploadedFiles[`rc_${i}`];
          }

          vehiclesWithIds.push(localVehicleData);
        }

        const toast = await this.toastController.create({
          message: 'Vehicle information saved successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        this.vehicleService.updateVehicles(vehiclesWithIds);
        this.vehicleService.setCurrentStep(4);

        this.router.navigate(['/transport/driver-registration/insurance']);

      } catch (error: any) {
        console.error('Failed to save vehicle info:', error);

        const toast = await this.toastController.create({
          message: error.message || 'Failed to save vehicle information. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      if (this.vehiclesArray.length === 0) {
        alert('Please add at least one vehicle');
      }
    }
  }

  private markFormGroupTouched() {
    this.vehiclesArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  getErrorMessage(fieldName: string, index: number): string {
    const control = this.vehiclesArray.at(index).get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (control.errors['pattern']) {
        if (fieldName === 'veh_number') return 'Enter valid vehicle number (e.g., KA01AB1234)';
        return `${fieldName.replace('_', ' ')} format is invalid`;
      }
      if (control.errors['min']) return `${fieldName.replace('_', ' ')} must be greater than 0`;
    }
    return '';
  }
}