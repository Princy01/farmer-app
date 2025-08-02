import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack } from 'ionicons/icons';
import { AddBusinessService, State, City, Location, BusinessType } from './add-business.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
        selector: 'app-add-business-location',
        templateUrl: './add-business-location.component.html',
        styleUrls: ['./add-business-location.component.scss'],
        standalone: true,
        imports: [
                CommonModule,
                ReactiveFormsModule,
                IonicModule
        ]
})
export class AddBusinessLocationComponent implements OnInit {
        businessForm: FormGroup;
        isEditMode = false;
        locationId: number | null = null;
        pageTitle = 'Add Business Location';
        states: State[] = [];
        cities: City[] = [];
        locations: Location[] = [];
        businessTypes: BusinessType[] = [];

        fieldLabels: { [key: string]: string } = {
                shopName: 'Shop Name',
                number: 'Phone Number',
                location: 'Location',
                state: 'State',
                city: 'City',
                address: 'Address',
                email: 'Email',
                gstNumber: 'GST Number',
                pan: 'PAN Number',
                pincode: 'Pincode',
                privilegedUser: 'Privileged User',
                b_type_id: 'Business Type',
                establishedYear: 'Established Year'
        };

        constructor(
                private formBuilder: FormBuilder,
                private addBusinessService: AddBusinessService,
                private router: Router,
                private route: ActivatedRoute,
                private toastController: ToastController,
                private loadingController: LoadingController,
                private alertController: AlertController,
                private authService: AuthService
        ) {
                addIcons({ save, arrowBack });

                this.businessForm = this.formBuilder.group({
                        shopName: ['', Validators.required],
                        number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
                        state: [null, Validators.required],
                        city: [null, Validators.required],
                        location: [null, Validators.required],
                        address: ['', Validators.required],
                        email: ['', [Validators.required, Validators.email]],
                        gstNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
                        pan: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
                        pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
                        privilegedUser: [false, Validators.required],
                        active_status: [1],
                        b_type_id: [null, Validators.required],
                        establishedYear: ['', [Validators.pattern(/^[0-9]{4}$/)]]
                });
        }

        ngOnInit() {
                // Auth check like home page
                if (!this.authService.isAuthenticated()) {
                        this.showAuthError();
                        return;
                }
                if (!this.authService.hasRole || !this.authService.hasRole('wholesaler')) {
                        this.showUnauthorizedError();
                        return;
                }

                this.route.queryParams.subscribe(params => {
                        if (params['mode'] === 'edit' && params['locationId']) {
                                this.isEditMode = true;
                                this.locationId = +params['locationId'];
                                this.pageTitle = 'Edit Business Location';
                                this.loadLocationData();
                        }
                });

                this.loadBusinessTypes();
                this.loadStates();

                this.businessForm.get('state')?.valueChanges.subscribe((stateId) => {
                        if (stateId) {
                                this.loadCities(stateId);
                                this.businessForm.get('city')?.reset();
                                this.businessForm.get('location')?.reset();
                                this.cities = [];
                                this.locations = [];
                        }
                });

                this.businessForm.get('city')?.valueChanges.subscribe((cityId) => {
                        if (cityId) {
                                this.loadLocations(cityId);
                                this.businessForm.get('location')?.reset();
                                this.locations = [];
                        }
                });
        }

        async showAuthError() {
                const alert = await this.alertController.create({
                        header: 'Authentication Error',
                        message: 'Your session has expired. Please login again.',
                        buttons: [
                                {
                                        text: 'OK',
                                        handler: () => {
                                                this.authService.logout();
                                                this.router.navigate(['/login']);
                                        }
                                }
                        ]
                });
                await alert.present();
        }

        async showUnauthorizedError() {
                const alert = await this.alertController.create({
                        header: 'Access Denied',
                        message: 'You do not have permission to access this page.',
                        buttons: [
                                {
                                        text: 'OK',
                                        handler: () => {
                                                this.router.navigate(['/login']);
                                        }
                                }
                        ]
                });
                await alert.present();
        }

        loadBusinessTypes() {
                this.addBusinessService.getBusinessTypes().subscribe(types => {
                        this.businessTypes = types;
                });
        }

        loadStates() {
                this.addBusinessService.getStates().subscribe(states => {
                        this.states = states;
                });
        }

        loadCities(stateId: number) {
                this.addBusinessService.getCitiesOfState(stateId).subscribe(cities => {
                        this.cities = cities;
                });
        }

        loadLocations(cityId: number) {
                this.addBusinessService.getLocationsByCity(cityId).subscribe(locations => {
                        this.locations = locations;
                });
        }

        // Placeholder for loading existing location data in edit mode
        loadLocationData() {
                // TODO: Implement API call to fetch location by ID and patch the form
                // Example:
                // this.addBusinessService.getBusinessLocationById(this.locationId).subscribe(location => {
                //     this.businessForm.patchValue({
                //         shopName: location.b_shop_name,
                //         number: location.b_number,
                //         state: location.b_state,
                //         city: location.b_city,
                //         location: location.b_location,
                //         address: location.b_address,
                //         email: location.b_email,
                //         gstNumber: location.b_gst_num,
                //         pan: location.b_pan_num,
                //         pincode: location.b_pincode,
                //         privilegedUser: location.b_privilege_user,
                //         active_status: location.active_status,
                //         b_type_id: location.b_type_id,
                //         establishedYear: location.b_established_year
                //     });
                // });
        }

        async onSubmit() {
                if (this.businessForm.valid) {
                        const loading = await this.loadingController.create({
                                message: this.isEditMode ? 'Updating location...' : 'Creating location...'
                        });
                        await loading.present();

                        try {
                                // Map form values to backend field names
                                const formValue = this.businessForm.value;
                                const formData: any = {
                                        b_shop_name: formValue.shopName,
                                        b_number: formValue.number,
                                        b_state: formValue.state,
                                        b_city: formValue.city,
                                        b_location: formValue.location,
                                        b_address: formValue.address,
                                        b_email: formValue.email,
                                        b_gst_num: formValue.gstNumber,
                                        b_pan_num: formValue.pan,
                                        b_pincode: formValue.pincode,
                                        b_privilege_user: formValue.privilegedUser ? 1 : 0,
                                        active_status: formValue.active_status,
                                        b_type_id: formValue.b_type_id,
                                        b_established_year: formValue.establishedYear
                                };
                                const userId = this.authService.getUserId();

                                if (!userId) {
                                        loading.dismiss();
                                        await this.showAuthError();
                                        return;
                                }

                                if (this.isEditMode && this.locationId) {
                                        formData.b_branch_id = this.locationId;
                                        this.addBusinessService.modifyBusinessesOfWholesaler(formData).subscribe({
                                                next: async () => {
                                                        loading.dismiss();
                                                        await this.showToast('Business location updated successfully!', 'success');
                                                        this.router.navigate(['/wholesaler/business-locations']);
                                                },
                                                error: async (error: any) => {
                                                        loading.dismiss();
                                                        await this.showToast('Error updating location. Please try again.', 'danger');
                                                }
                                        });
                                } else {
                                        this.addBusinessService.createBusinessesOfWholesaler(formData).subscribe({
                                                next: async () => {
                                                        loading.dismiss();
                                                        await this.showToast('Business location created successfully!', 'success');
                                                        this.router.navigate(['/wholesaler/business-locations']);
                                                },
                                                error: async (error: any) => {
                                                        loading.dismiss();
                                                        await this.showToast('Error creating location. Please try again.', 'danger');
                                                }
                                        });
                                }
                        } catch (error) {
                                loading.dismiss();
                                await this.showToast('An unexpected error occurred.', 'danger');
                        }
                } else {
                        await this.showToast('Please fill in all required fields correctly.', 'warning');
                        this.markFormGroupTouched();
                }
        }

        async showToast(message: string, color: string) {
                const toast = await this.toastController.create({
                        message,
                        duration: 3000,
                        color,
                        position: 'bottom'
                });
                await toast.present();
        }

        markFormGroupTouched() {
                Object.keys(this.businessForm.controls).forEach(key => {
                        this.businessForm.get(key)?.markAsTouched();
                });
        }

        getErrorMessage(fieldName: string): string {
                const control = this.businessForm.get(fieldName);
                const fieldLabel = this.fieldLabels[fieldName] || fieldName;

                if (control?.errors && control?.touched) {
                        if (control.errors['required']) {
                                return `${fieldLabel} is required`;
                        }
                        if (control.errors['email']) {
                                return 'Please enter a valid email address';
                        }
                        if (control.errors['pattern']) {
                                switch (fieldName) {
                                        case 'number':
                                                return 'Please enter a valid 10-digit phone number';
                                        case 'gstNumber':
                                                return 'Please enter a valid GST number';
                                        case 'pan':
                                                return 'Please enter a valid PAN number';
                                        case 'pincode':
                                                return 'Please enter a valid 6-digit pincode';
                                        case 'establishedYear':
                                                return 'Please enter a valid year';
                                        default:
                                                return 'Please enter a valid value';
                                }
                        }
                }
                return '';
        }

        goBack() {
                this.router.navigate(['/wholesaler/business-locations']);
        }
}