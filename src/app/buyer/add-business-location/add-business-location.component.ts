import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack } from 'ionicons/icons';
import { AddBusinessService, State, City, Location, BusinessType, BusinessBranch } from './add-business.service';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessBranchWithNames } from '../business-locations/business-locations.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
        selector: 'app-add-business-location',
        templateUrl: './add-business-location.component.html',
        styleUrls: ['./add-business-location.component.scss'],
        standalone: true,
        imports: [
                CommonModule,
                ReactiveFormsModule,
                IonicModule,
                TranslatePipe
        ]
})
export class AddBusinessLocationComponent implements OnInit {
        businessForm: FormGroup;
        isEditMode = false;
        locationId: number | null = null;
        pageTitle = 'ADD_BUSINESS_LOCATION.PAGE_TITLE_ADD';
        states: State[] = [];
        cities: City[] = [];
        locations: Location[] = [];
        businessTypes: BusinessType[] = [];

        fieldLabels: { [key: string]: string } = {
                shopName: 'ADD_BUSINESS_LOCATION.SHOP_NAME',
                number: 'ADD_BUSINESS_LOCATION.PHONE_NUMBER',
                location: 'ADD_BUSINESS_LOCATION.LOCATION',
                state: 'ADD_BUSINESS_LOCATION.STATE',
                city: 'ADD_BUSINESS_LOCATION.CITY',
                address: 'ADD_BUSINESS_LOCATION.ADDRESS',
                email: 'ADD_BUSINESS_LOCATION.EMAIL',
                gstNumber: 'ADD_BUSINESS_LOCATION.GST_NUMBER',
                pan: 'ADD_BUSINESS_LOCATION.PAN_NUMBER',
                privilegedUser: 'ADD_BUSINESS_LOCATION.PRIVILEGED_USER',
                b_type_id: 'ADD_BUSINESS_LOCATION.BUSINESS_TYPE',
                establishedYear: 'ADD_BUSINESS_LOCATION.ESTABLISHED_YEAR',
                active_status: 'ADD_BUSINESS_LOCATION.ACTIVE_STATUS'
        };

        constructor(
                private formBuilder: FormBuilder,
                private addBusinessService: AddBusinessService,
                private router: Router,
                private route: ActivatedRoute,
                private toastController: ToastController,
                private loadingController: LoadingController,
                private alertController: AlertController,
                private authService: AuthService,
                private translate: TranslateService
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
                        privilegedUser: [false],
                        active_status: [true],
                        b_type_id: [3],
                        establishedYear: ['', [Validators.pattern(/^[0-9]{4}$/)]]
                });
        }

        ngOnInit() {
                if (!this.authService.isAuthenticated()) {
                        this.showAuthError();
                        return;
                }
                if (!this.authService.hasRole || !this.authService.hasRole('retailer')) {
                        this.showUnauthorizedError();
                        return;
                }

                this.route.queryParams.subscribe(params => {
                        if (params['mode'] === 'edit' && params['locationId']) {

                                this.isEditMode = true;
                                this.locationId = +params['locationId'];
                                this.pageTitle = 'ADD_BUSINESS_LOCATION.PAGE_TITLE_EDIT';
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
                        header: this.translate.instant('ADD_BUSINESS_LOCATION.AUTH_ERROR'),
                        message: this.translate.instant('ADD_BUSINESS_LOCATION.SESSION_EXPIRED'),
                        buttons: [
                                {
                                        text: this.translate.instant('ADD_BUSINESS_LOCATION.OK'),
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
                        header: this.translate.instant('ADD_BUSINESS_LOCATION.ACCESS_DENIED'),
                        message: this.translate.instant('ADD_BUSINESS_LOCATION.NO_PERMISSION'),
                        buttons: [
                                {
                                        text: this.translate.instant('ADD_BUSINESS_LOCATION.OK'),
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

        loadLocationData() {
                if (this.locationId) {
                        const navigation = this.router.getCurrentNavigation();
                        if (navigation && navigation.extras.state) {
                                let location = navigation.extras.state['location'] as BusinessBranchWithNames | null;
                                console.log('Location from state:', location);
                                this.loadCities(location!.state_id);
                                this.loadLocations(location!.city_id);
                                this.businessForm.patchValue({
                                        shopName: location?.shop_name || '',
                                        number: location?.number || '',
                                        state: location?.state_id || null,
                                        city: location?.city_id || null,
                                        location: location?.location_id || null,
                                        address: location?.address || '',
                                        email: location?.email || '',
                                        gstNumber: location?.gst_num || '',
                                        pan: location?.pan_num || '',
                                        privilegedUser: location?.privilege_user || false,
                                        active_status: location?.active_status ? 1 : 0,
                                        b_type_id: location?.type_id || 3,
                                        establishedYear: location?.established_year || ''
                                });
                                // Disable all fields except phone number, email, location, and address
                                this.businessForm.get('shopName')?.disable();
                                this.businessForm.get('state')?.disable();
                                this.businessForm.get('city')?.disable();
                                this.businessForm.get('gstNumber')?.disable();
                                this.businessForm.get('pan')?.disable();
                                this.businessForm.get('privilegedUser')?.disable();
                                this.businessForm.get('b_type_id')?.disable();
                                this.businessForm.get('establishedYear')?.disable();
                                this.businessForm.get('active_status')?.disable();
                                // The following remain enabled:
                                this.businessForm.get('number')?.enable();
                                this.businessForm.get('location')?.enable();
                                this.businessForm.get('address')?.enable();
                                this.businessForm.get('email')?.enable();
                        }
                }
        }

        async onSubmit() {
                if (this.businessForm.valid) {
                        const loading = await this.loadingController.create({
                                message: this.isEditMode ?
                                        this.translate.instant('ADD_BUSINESS_LOCATION.UPDATING') :
                                        this.translate.instant('ADD_BUSINESS_LOCATION.CREATING')
                        });
                        await loading.present();

                        try {
                                // Map form values to backend field names that match BusinessBranch struct
                                const formValue = this.businessForm.getRawValue();
                                const formData: any = {
                                        shop_name: formValue.shopName,
                                        number: formValue.number,
                                        type_id: 3,
                                        location: formValue.location,
                                        state: formValue.state,
                                        b_city_id: formValue.city,
                                        address: formValue.address,
                                        email: formValue.email,
                                        gst_num: formValue.gstNumber,
                                        pan_num: formValue.pan,
                                        privilege_user: false,
                                        established_year: formValue.establishedYear || '',
                                        active_status: true
                                };

                                const userId = this.authService.getUserId();
                                if (!userId) {
                                        loading.dismiss();
                                        await this.showAuthError();
                                        return;
                                }

                                if (this.isEditMode && this.locationId) {
                                        // For update, add the branch_id
                                        formData.branch_id = this.locationId;
                                        this.addBusinessService.modifyBusinessBranch(formData).subscribe({
                                                next: async () => {
                                                        loading.dismiss();
                                                        await this.showToast(
                                                                this.translate.instant('ADD_BUSINESS_LOCATION.UPDATE_SUCCESS'),
                                                                'success'
                                                        );
                                                        this.router.navigate(['/buyer/business-locations']);
                                                },
                                                error: async (error: any) => {
                                                        loading.dismiss();
                                                        console.error('Update error:', error);
                                                        await this.showToast(
                                                                this.translate.instant('ADD_BUSINESS_LOCATION.UPDATE_ERROR'),
                                                                'danger'
                                                        );
                                                }
                                        });
                                } else {
                                        this.addBusinessService.createBusinessBranch(formData).subscribe({
                                                next: async () => {
                                                        loading.dismiss();
                                                        await this.showToast(
                                                                this.translate.instant('ADD_BUSINESS_LOCATION.CREATE_SUCCESS'),
                                                                'success'
                                                        );
                                                        this.router.navigate(['/buyer/business-locations']);
                                                },
                                                error: async (error: any) => {
                                                        loading.dismiss();
                                                        console.error('Create error:', error);
                                                        await this.showToast(
                                                                this.translate.instant('ADD_BUSINESS_LOCATION.CREATE_ERROR'),
                                                                'danger'
                                                        );
                                                }
                                        });
                                }
                        } catch (error) {
                                loading.dismiss();
                                console.error('Unexpected error:', error);
                                await this.showToast(
                                        this.translate.instant('ADD_BUSINESS_LOCATION.UNEXPECTED_ERROR'),
                                        'danger'
                                );
                        }
                } else {
                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.VALIDATION_ERROR'),
                                'warning'
                        );
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
                const fieldLabel = this.translate.instant(this.fieldLabels[fieldName] || fieldName);

                if (control?.errors && control?.touched) {
                        if (control.errors['required']) {
                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_REQUIRED', { field: fieldLabel });
                        }
                        if (control.errors['email']) {
                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_EMAIL');
                        }
                        if (control.errors['pattern']) {
                                switch (fieldName) {
                                        case 'number':
                                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_PHONE');
                                        case 'gstNumber':
                                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_GST');
                                        case 'pan':
                                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_PAN');
                                        case 'establishedYear':
                                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_YEAR');
                                        default:
                                                return this.translate.instant('ADD_BUSINESS_LOCATION.ERROR_INVALID');
                                }
                        }
                }
                return '';
        }

        goBack() {
                this.router.navigate(['/buyer/business-locations']);
        }
}