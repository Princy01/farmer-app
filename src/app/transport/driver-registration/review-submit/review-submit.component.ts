// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { Router } from '@angular/router';
// import { DriverRegistrationService } from '../services/driver-registration.service';
// import { DriverRegistrationData } from '../models/driver.models';

// @Component({
//   selector: 'app-review-submit',
//   templateUrl: './review-submit.component.html',
//   styleUrls: ['./review-submit.component.scss'],
//   standalone: true,
//   imports: [CommonModule, IonicModule]
// })
// export class ReviewSubmitComponent implements OnInit {
//   registrationData: DriverRegistrationData;
//   isSubmitting = false;
//   showSuccessModal = false;

//   constructor(
//     private router: Router,
//     private registrationService: DriverRegistrationService
//   ) {
//     this.registrationData = this.registrationService.getRegistrationData();
//   }

//   ngOnInit() {
//     // Redirect if no data
//     if (!this.registrationData.driverInfo?.first_name) {
//       this.router.navigate(['/transport/driver-registration/basic-info']);
//       return;
//     }
//   }

//   getVehicleTypeName(typeId: string): string {
//     const vehicleType = this.registrationService.vehicleTypes.find(type => type.type_id === typeId);
//     return vehicleType ? vehicleType.type_name : typeId;
//   }

//   calculateAge(dob: string): number {
//     return this.registrationService.calculateAge(dob);
//   }

//   onEdit(section: string) {
//     switch (section) {
//       case 'basic':
//         this.router.navigate(['/transport/driver-registration/basic-info']);
//         break;
//       case 'documents':
//         this.router.navigate(['/transport/driver-registration/documents']);
//         break;
//       case 'vehicles':
//         this.router.navigate(['/transport/driver-registration/vehicles']);
//         break;
//       case 'insurance':
//         this.router.navigate(['/transport/driver-registration/insurance']);
//         break;
//     }
//   }

//   onPrevious() {
//     this.router.navigate(['/transport/driver-registration/insurance']);
//   }

//   async onSubmit() {
//     this.isSubmitting = true;

//     try {
//       const success = await this.registrationService.submitRegistration();

//       if (success) {
//         this.showSuccessModal = true;
//       } else {
//         alert('Registration failed. Please try again.');
//       }
//     } catch (error) {
//       console.error('Submission error:', error);
//       alert('An error occurred during registration. Please try again.');
//     } finally {
//       this.isSubmitting = false;
//     }
//   }

//   onSuccessClose() {
//     this.showSuccessModal = false;
//     this.registrationService.resetRegistration();
//     this.router.navigate(['/transport']);
//   }

//   hasUploadedFile(fileField: any): boolean {
//     return fileField instanceof File;
//   }

//   getFileDisplayName(fileField: any): string {
//     if (this.hasUploadedFile(fileField)) {
//       return fileField.name;
//     }
//     return 'Not uploaded';
//   }
// }