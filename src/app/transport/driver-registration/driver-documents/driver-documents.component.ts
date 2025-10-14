import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DriverDocumentsService, DriverDocumentRequest } from './driver-documents.service';
import { DriverDocument } from '../models/driver.models';

@Component({
  selector: 'app-driver-documents',
  templateUrl: './driver-documents.component.html',
  styleUrls: ['./driver-documents.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class DriverDocumentsComponent implements OnInit {
  documentsForm!: FormGroup;
  isSubmitting = false;
  uploadedFiles: { [key: string]: File } = {};

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private documentsService: DriverDocumentsService,
    private toastController: ToastController
  ) {}

  // Get data from service instead of component properties
  get documentCategories() {
    return this.documentsService.documentCategories;
  }

  get documentTypes() {
    return this.documentsService.documentTypes;
  }

  ngOnInit() {
    this.initializeForm();
    this.loadExistingData();
    this.addDocument(); // Add first document by default
  }

  initializeForm() {
    this.documentsForm = this.formBuilder.group({
      documents: this.formBuilder.array([])
    });
  }

  get documentsArray(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  createDocumentFormGroup(): FormGroup {
    return this.formBuilder.group({
      document_category: ['', Validators.required],
      document_number: ['', Validators.required],
      doc_type: ['PDF', Validators.required],
      document_image: [null]
    });
  }

  addDocument() {
    this.documentsArray.push(this.createDocumentFormGroup());
  }

  removeDocument(index: number) {
    // Remove uploaded file if exists
    const fileKey = `document_${index}`;
    if (this.uploadedFiles[fileKey]) {
      delete this.uploadedFiles[fileKey];
    }

    this.documentsArray.removeAt(index);

    // Reindex uploaded files
    this.reindexUploadedFiles();
  }

  private reindexUploadedFiles() {
    const newUploadedFiles: { [key: string]: File } = {};
    Object.keys(this.uploadedFiles).forEach(key => {
      if (key.startsWith('document_')) {
        const oldIndex = parseInt(key.split('_')[1]);
        const newIndex = oldIndex > this.documentsArray.length ? oldIndex - 1 : oldIndex;
        if (newIndex < this.documentsArray.length) {
          newUploadedFiles[`document_${newIndex}`] = this.uploadedFiles[key];
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

      this.uploadedFiles[`document_${index}`] = file;

      // Update form control
      const documentControl = this.documentsArray.at(index);
      documentControl.patchValue({ document_image: file });
    }
  }

  getFileName(index: number): string {
    return this.uploadedFiles[`document_${index}`]?.name || 'No file selected';
  }

  hasFile(index: number): boolean {
    return !!this.uploadedFiles[`document_${index}`];
  }

  loadExistingData() {
    const registrationData = this.documentsService.getRegistrationData();
    if (registrationData.documents && registrationData.documents.length > 0) {
      // Clear existing form array
      while (this.documentsArray.length) {
        this.documentsArray.removeAt(0);
      }

      // Add documents from saved data
      registrationData.documents.forEach(doc => {
        const docGroup = this.createDocumentFormGroup();
        docGroup.patchValue(doc);
        this.documentsArray.push(docGroup);
      });
    }
  }

  onPrevious() {
    this.router.navigate(['/transport/driver-registration/basic-info']);
  }

  async onSaveAndNext() {
    if (this.documentsForm.valid && this.documentsArray.length > 0) {
      this.isSubmitting = true;

      try {
        // Get driver_id from registration data
        const registrationData = this.documentsService.getRegistrationData();
        const driverId = registrationData.driverInfo.driver_id;

        if (!driverId) {
          throw new Error('Driver ID not found. Please complete basic information first.');
        }

        // Submit each document to backend
        for (let i = 0; i < this.documentsArray.length; i++) {
          const documentForm = this.documentsArray.at(i);

          // Prepare document data for backend
          const documentData: DriverDocumentRequest = {
            driver_id: parseInt(driverId.toString()), // Convert to number
            doc_type: documentForm.value.doc_type,
            doc_image: this.uploadedFiles[`document_${i}`] ? this.uploadedFiles[`document_${i}`].name : '' // For now, just store filename
          };

          await this.documentsService.addDriverDocument(documentData).toPromise();
        }

        // Show success message
        const toast = await this.toastController.create({
          message: 'Documents saved successfully!',
          duration: 2000,
          color: 'success'
        });
        await toast.present();

        // Update local registration service for next steps
        const documents: DriverDocument[] = this.documentsArray.value.map((doc: any, index: number) => {
          const document: DriverDocument = {
            document_category: doc.document_category,
            document_number: doc.document_number,
            doc_type: doc.doc_type
          };

          if (this.uploadedFiles[`document_${index}`]) {
            document.document_image = this.uploadedFiles[`document_${index}`];
          }

          return document;
        });

        this.documentsService.updateDocuments(documents);
        this.documentsService.setCurrentStep(3);

        // Navigate to next step
        this.router.navigate(['/transport/driver-registration/vehicles']);

      } catch (error: any) {
        console.error('Failed to save documents:', error);

        const toast = await this.toastController.create({
          message: error.message || 'Failed to save documents. Please try again.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.markFormGroupTouched();
      if (this.documentsArray.length === 0) {
        alert('Please add at least one document');
      }
    }
  }

  private markFormGroupTouched() {
    this.documentsArray.controls.forEach(control => {
      Object.keys(control.value).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  getErrorMessage(fieldName: string, index: number): string {
    const control = this.documentsArray.at(index).get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
    }
    return '';
  }
}