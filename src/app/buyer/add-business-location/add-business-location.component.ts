import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack, camera, location, trash, informationCircle, business, cameraOutline } from 'ionicons/icons';
import { AddBusinessService, State, City, Location, BusinessType, BusinessBranch } from './add-business.service';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessBranchWithNames } from '../business-locations/business-locations.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import * as exifr from 'exifr';

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
        capturedImage: string = '';
        latitude: number = 0;
        longitude: number = 0;
        locationCaptured: boolean = false;

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
                addIcons({ save, arrowBack, camera, location, trash, informationCircle, business, cameraOutline });

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
                                // Load existing image and coordinates
                                if (location?.image) {
                                        this.capturedImage = location.image;
                                }
                                if (location?.latitude && location?.longitude) {
                                        this.latitude = location.latitude;
                                        this.longitude = location.longitude;
                                        this.locationCaptured = true;
                                }
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

        /**
         * Capture shop location image with camera or file input (browser fallback)
         */
        async captureShopImage() {
                // Detect if running in browser (not on device)
                const isBrowser = !window || !(window as any).Capacitor?.isNativePlatform?.();
                if (isBrowser) {
                        this.captureImageFromFileInput();
                        return;
                }
                try {
                        const loading = await this.loadingController.create({
                                message: this.translate.instant('ADD_BUSINESS_LOCATION.CAPTURING_IMAGE')
                        });
                        await loading.present();

                        // Request camera permissions
                        const permissions = await Camera.checkPermissions();
                        if (permissions.camera !== 'granted') {
                                await Camera.requestPermissions();
                                const newPermissions = await Camera.checkPermissions();
                                if (newPermissions.camera !== 'granted') {
                                        loading.dismiss();
                                        await this.showToast(
                                                this.translate.instant('ADD_BUSINESS_LOCATION.CAMERA_PERMISSION_DENIED'),
                                                'danger'
                                        );
                                        return;
                                }
                        }

                        // Take photo
                        const image = await Camera.getPhoto({
                                quality: 90,
                                allowEditing: false,
                                resultType: CameraResultType.Base64,
                                source: CameraSource.Camera,
                                saveToGallery: false
                        });

                        if (!image.base64String) {
                                loading.dismiss();
                                await this.showToast(
                                        this.translate.instant('ADD_BUSINESS_LOCATION.IMAGE_CAPTURE_FAILED'),
                                        'danger'
                                );
                                return;
                        }

                        // Store the image
                        this.capturedImage = `data:image/${image.format};base64,${image.base64String}`;

                        // Try to extract GPS coordinates from EXIF data
                        const extracted = await this.extractGPSFromImage(this.capturedImage);

                        if (extracted) {
                                this.locationCaptured = true;
                                loading.dismiss();
                                await this.showToast(
                                        this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_FROM_IMAGE'),
                                        'success'
                                );
                                await this.confirmLocation();
                        } else {
                                // Fallback to device location
                                await this.getDeviceLocation(loading);
                        }

                } catch (error) {
                        console.error('Error capturing image:', error);
                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.IMAGE_CAPTURE_ERROR'),
                                'danger'
                        );
                }
        }

        /**
         * Browser fallback: Use file input to select image and extract EXIF/location
         */
        captureImageFromFileInput() {
                // Create file input dynamically
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (event: any) => {
                        const file = event.target.files[0];
                        if (!file) return;
                        // Show loading
                        const loading = await this.loadingController.create({
                                message: this.translate.instant('ADD_BUSINESS_LOCATION.CAPTURING_IMAGE')
                        });
                        await loading.present();
                        // Read file as base64
                        const reader = new FileReader();
                        reader.onload = async (e: any) => {
                                this.capturedImage = e.target.result;
                                // Try to extract GPS
                                const extracted = await this.extractGPSFromImage(this.capturedImage);
                                if (extracted) {
                                        this.locationCaptured = true;
                                        loading.dismiss();
                                        await this.showToast(
                                                this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_FROM_IMAGE'),
                                                'success'
                                        );
                                        await this.confirmLocation();
                                } else {
                                        // Fallback to browser geolocation
                                        await this.getBrowserGeolocation(loading);
                                }
                        };
                        reader.readAsDataURL(file);
                };
                input.click();
        }

        /**
         * Fallback: Get browser geolocation (for desktop dev)
         */
        async getBrowserGeolocation(loading: HTMLIonLoadingElement) {
                if (!navigator.geolocation) {
                        loading.dismiss();
                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_ERROR'),
                                'danger'
                        );
                        return;
                }
                navigator.geolocation.getCurrentPosition(
                        async (position) => {
                                this.latitude = position.coords.latitude;
                                this.longitude = position.coords.longitude;
                                this.locationCaptured = true;
                                loading.dismiss();
                                await this.showToast(
                                        this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_FROM_DEVICE'),
                                        'success'
                                );
                                await this.confirmLocation();
                        },
                        async (error) => {
                                loading.dismiss();
                                await this.showToast(
                                        this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_ERROR'),
                                        'danger'
                                );
                        },
                        { enableHighAccuracy: true, timeout: 15000 }
                );
        }

        /**
         * Extract GPS coordinates from image EXIF data
         */
        async extractGPSFromImage(base64Image: string): Promise<boolean> {
                try {
                        // Convert base64 to blob
                        const response = await fetch(base64Image);
                        const blob = await response.blob();

                        // Extract EXIF data
                        const exifData = await exifr.parse(blob, {
                                gps: true,
                                pick: ['latitude', 'longitude']
                        });

                        if (exifData && exifData.latitude && exifData.longitude) {
                                this.latitude = exifData.latitude;
                                this.longitude = exifData.longitude;
                                return true;
                        }

                        return false;
                } catch (error) {
                        console.error('Error extracting EXIF data:', error);
                        return false;
                }
        }

        /**
         * Fallback: Get device location using Geolocation plugin
         */
        async getDeviceLocation(loading: HTMLIonLoadingElement) {
                try {
                        // Check geolocation permissions
                        const permissions = await Geolocation.checkPermissions();
                        if (permissions.location !== 'granted') {
                                await Geolocation.requestPermissions();
                                const newPermissions = await Geolocation.checkPermissions();
                                if (newPermissions.location !== 'granted') {
                                        loading.dismiss();
                                        await this.showToast(
                                                this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_PERMISSION_DENIED'),
                                                'danger'
                                        );
                                        return;
                                }
                        }

                        // Get current position
                        const position = await Geolocation.getCurrentPosition({
                                enableHighAccuracy: true,
                                timeout: 15000
                        });

                        this.latitude = position.coords.latitude;
                        this.longitude = position.coords.longitude;
                        this.locationCaptured = true;

                        loading.dismiss();

                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_FROM_DEVICE'),
                                'success'
                        );

                        await this.confirmLocation();

                } catch (error) {
                        loading.dismiss();
                        console.error('Error getting device location:', error);
                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_ERROR'),
                                'danger'
                        );
                }
        }

        /**
         * Show confirmation dialog for captured location
         */
        async confirmLocation() {
                const alert = await this.alertController.create({
                        header: this.translate.instant('ADD_BUSINESS_LOCATION.CONFIRM_LOCATION'),
                        message: this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_DETAILS', {
                                latitude: this.latitude.toFixed(6),
                                longitude: this.longitude.toFixed(6)
                        }),
                        buttons: [
                                {
                                        text: this.translate.instant('ADD_BUSINESS_LOCATION.RETAKE'),
                                        role: 'cancel',
                                        handler: () => {
                                                this.captureShopImage();
                                        }
                                },
                                {
                                        text: this.translate.instant('ADD_BUSINESS_LOCATION.CONFIRM'),
                                        handler: () => {
                                                this.showToast(
                                                        this.translate.instant('ADD_BUSINESS_LOCATION.LOCATION_CONFIRMED'),
                                                        'success'
                                                );
                                        }
                                }
                        ]
                });
                await alert.present();
        }

        /**
         * Remove captured image and location
         */
        removeImage() {
                this.capturedImage = '';
                this.latitude = 0;
                this.longitude = 0;
                this.locationCaptured = false;
        }

        async onSubmit() {
                // Validate location and image are captured
                if (!this.locationCaptured || !this.capturedImage) {
                        await this.showToast(
                                this.translate.instant('ADD_BUSINESS_LOCATION.CAPTURE_LOCATION_FIRST'),
                                'warning'
                        );
                        return;
                }

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
                                        active_status: true,
                                        latitude: this.latitude,
                                        longitude: this.longitude,
                                        image: this.capturedImage
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

        getFormProgress(): number {
                const fields = Object.keys(this.businessForm.controls);
                const totalFields = fields.length;
                let filledFields = 0;

                fields.forEach(fieldName => {
                        const control = this.businessForm.get(fieldName);
                        if (control && control.valid && control.value) {
                                filledFields++;
                        }
                });

                // Add location capture to progress
                if (this.locationCaptured) {
                        filledFields++;
                }

                const totalItems = totalFields + 1; // +1 for location capture
                return Math.round((filledFields / totalItems) * 100);
        }
}