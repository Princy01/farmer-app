import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { save, arrowBack, camera, location } from 'ionicons/icons';
import { AddBusinessService, State, City, Location, BusinessType, BusinessBranch } from './add-business.service';
import { AuthService } from 'src/app/auth/auth.service';
import { BusinessBranchWithNames } from '../business-locations/business-locations.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import * as exifr from 'exifr';
import { Subject, EMPTY } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
	selector: 'app-add-business-location',
	templateUrl: './add-business-location.component.html',
	styleUrls: ['./add-business-location.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule,
		TranslatePipe,
	]
})
export class AddBusinessLocationComponent implements OnInit, OnDestroy {
	businessForm: FormGroup;
	isEditMode = false;
	locationId: number | null = null;
	pageTitle = 'Add Business Location';
	states: State[] = [];
	cities: City[] = [];
	locations: Location[] = [];
	businessTypes: BusinessType[] = [];
	capturedImage: string = '';
	latitude: number = 0;
	longitude: number = 0;
	locationCaptured: boolean = false;

	fieldLabels: { [key: string]: string } = {
		shopName: 'ADD_BUSINESS_FORM.SHOP_NAME',
		number: 'ADD_BUSINESS_FORM.PHONE_NUMBER',
		location: 'ADD_BUSINESS_FORM.LOCATION',
		state: 'ADD_BUSINESS_FORM.STATE',
		city: 'ADD_BUSINESS_FORM.CITY',
		address: 'ADD_BUSINESS_FORM.ADDRESS',
		email: 'ADD_BUSINESS_FORM.EMAIL',
		gstNumber: 'ADD_BUSINESS_FORM.GST_NUMBER',
		pan: 'ADD_BUSINESS_FORM.PAN',
		privilegedUser: 'ADD_BUSINESS_FORM.PRIVILEGED_USER',
		b_type_id: 'ADD_BUSINESS_FORM.BUSINESS_TYPE',
		establishedYear: 'ADD_BUSINESS_FORM.ESTABLISHED_YEAR',
		active_status: 'ADD_BUSINESS_FORM.ACTIVE_STATUS'
	};

	private destroy$ = new Subject<void>();

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
		addIcons({ save, arrowBack, camera, location });

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
		if (!this.authService.hasRole || !this.authService.hasRole('wholesaler')) {
			this.showUnauthorizedError();
			return;
		}

		this.route.queryParams.subscribe(params => {
			if (params['mode'] === 'edit' && params['locationId']) {

				this.isEditMode = true;
				this.locationId = +params['locationId'];
				this.pageTitle = this.translate.instant('ADD_BUSINESS_FORM.EDIT_PAGE_TITLE');
				this.loadLocationData();
			}
		});

		this.loadBusinessTypes();
		this.loadStates();

		this.businessForm.get('state')?.valueChanges
			.pipe(
				switchMap((stateId) => {
					if (stateId) {
						this.businessForm.get('city')?.reset();
						this.businessForm.get('location')?.reset();
						this.cities = [];
						this.locations = [];
						return this.addBusinessService.getCitiesOfState(stateId);
					}
					return EMPTY;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (data: City[]) => {
					this.cities = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_CITIES'),
						'danger'
					);
				}
			});

		this.businessForm.get('city')?.valueChanges
			.pipe(
				switchMap((cityId) => {
					if (cityId) {
						this.businessForm.get('location')?.reset();
						this.locations = [];
						return this.addBusinessService.getLocationsByCity(cityId);
					}
					return EMPTY;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (data: Location[]) => {
					this.locations = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_LOCATIONS'),
						'danger'
					);
				}
			});
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	async showAuthError() {
		const alert = await this.alertController.create({
			header: this.translate.instant('ADD_BUSINESS_FORM.AUTH_ERROR'),
			message: this.translate.instant('ADD_BUSINESS_FORM.SESSION_EXPIRED'),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.OK'),
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
			header: this.translate.instant('ADD_BUSINESS_FORM.ACCESS_DENIED'),
			message: this.translate.instant('ADD_BUSINESS_FORM.NO_PERMISSION'),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.OK'),
					handler: () => {
						this.router.navigate(['/login']);
					}
				}
			]
		});
		await alert.present();
	}

	loadStates() {
		this.addBusinessService.getStates()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: State[]) => {
					this.states = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_STATES'),
						'danger'
					);
				}
			});
	}

	loadCities(stateId: number) {
		this.addBusinessService.getCitiesOfState(stateId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: City[]) => {
					this.cities = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_CITIES'),
						'danger'
					);
				}
			});
	}

	loadLocations(cityId: number) {
		this.addBusinessService.getLocationsByCity(cityId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: Location[]) => {
					this.locations = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_LOCATIONS'),
						'danger'
					);
				}
			});
	}

	loadBusinessTypes() {
		this.addBusinessService.getBusinessTypes()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data: BusinessType[]) => {
					this.businessTypes = data;
				},
				error: () => {
					this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_TYPES'),
						'danger'
					);
				}
			});
	}

	loadLocationData() {
		if (this.locationId) {
			// First try to get data from navigation state (original approach)
			const navigation = this.router.getCurrentNavigation();
			if (navigation && navigation.extras.state) {
				let location = navigation.extras.state['location'] as BusinessBranchWithNames | null;

				if (location) {
					// Load cities and locations based on state
					if (location.state_id) {
						this.loadCities(location.state_id);
					}
					if (location.city_id) {
						this.loadLocations(location.city_id);
					}

					// Patch form with navigation state data
					this.businessForm.patchValue({
						shopName: location.shop_name || '',
						number: location.number || '',
						state: location.state_id || null,
						city: location.city_id || null,
						location: location.location_id || null,
						address: location.address || '',
						email: location.email || '',
						gstNumber: location.gst_num || '',
						pan: location.pan_num || '',
						privilegedUser: location.privilege_user || false,
						active_status: location.active_status ? 1 : 0,
						b_type_id: location.type_id || 3,
						establishedYear: location.established_year || ''
					});

					// Load existing image and coordinates if available
					if (location.image) {
						this.capturedImage = location.image;
					}
					if (location.latitude && location.longitude) {
						this.latitude = location.latitude;
						this.longitude = location.longitude;
						this.locationCaptured = true;
					}

					this.setEditModeFieldStates();
					return;
				}
			}

			// Fallback: Load data from API if navigation state is not available
			this.addBusinessService.getBusinessBranchById(this.locationId)
				.pipe(takeUntil(this.destroy$))
				.subscribe({
					next: (data: BusinessBranch) => {
						// Load cities and locations based on state
						if (data.state) {
							this.loadCities(data.state);
						}
						if (data.city_id) {
							this.loadLocations(data.city_id);
						}

						this.businessForm.patchValue({
							shopName: data.shop_name || '',
							number: data.number || '',
							state: data.state || null,
							city: data.city_id || null,
							location: data.location || null,
							address: data.address || '',
							email: data.email || '',
							gstNumber: data.gst_num || '',
							pan: data.pan_num || '',
							privilegedUser: data.privilege_user || false,
							active_status: data.active_status,
							b_type_id: data.type_id || 3,
							establishedYear: data.established_year || ''
						});

						// Load existing image and coordinates
						if (data.image) {
							this.capturedImage = data.image;
						}
						if (data.latitude && data.longitude) {
							this.latitude = data.latitude;
							this.longitude = data.longitude;
							this.locationCaptured = true;
						}

						this.setEditModeFieldStates();
					},
					error: () => {
						this.showToast(
							this.translate.instant('ADD_BUSINESS_FORM.ERROR_LOADING_DATA'),
							'danger'
						);
					}
				});
		}
	}

	/**
	 * Set field enabled/disabled states for edit mode
	 */
	private setEditModeFieldStates() {
		if (this.isEditMode) {
			// Disable these fields - they remain readonly in edit mode
			this.businessForm.get('shopName')?.disable();
			this.businessForm.get('state')?.disable();
			this.businessForm.get('city')?.disable();
			this.businessForm.get('gstNumber')?.disable();
			this.businessForm.get('pan')?.disable();
			this.businessForm.get('privilegedUser')?.disable();
			this.businessForm.get('b_type_id')?.disable();
			this.businessForm.get('establishedYear')?.disable();
			this.businessForm.get('active_status')?.disable();

			// Enable these fields - they remain editable in edit mode
			this.businessForm.get('number')?.enable();
			this.businessForm.get('location')?.enable();
			this.businessForm.get('address')?.enable();
			this.businessForm.get('email')?.enable();
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
				message: this.translate.instant('ADD_BUSINESS_FORM.CAPTURING_IMAGE')
			});
			await loading.present();

			// Request camera permissions
			const permissions = await Camera.checkPermissions();
			if (permissions.camera !== 'granted') {
				const requestResult = await Camera.requestPermissions({ permissions: ['camera'] });
				if (requestResult.camera !== 'granted') {
					loading.dismiss();
					await this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.CAMERA_PERMISSION_DENIED'),
						'warning'
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
					this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_FAILED'),
					'danger'
				);
				return;
			}

			// Store the image
			this.capturedImage = `data:image/${image.format};base64,${image.base64String}`;

			// Try to extract GPS coordinates from EXIF data
			const extracted = await this.extractGPSFromImage(this.capturedImage);

			if (extracted) {
				loading.dismiss();
				await this.confirmLocation();
			} else {
				// Fallback to device geolocation
				await this.getDeviceLocation(loading);
			}

		} catch (error) {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.IMAGE_CAPTURE_ERROR'),
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
				message: this.translate.instant('ADD_BUSINESS_FORM.CAPTURING_IMAGE')
			});
			await loading.present();
			// Read file as base64
			const reader = new FileReader();
			reader.onload = async (e: any) => {
				this.capturedImage = e.target.result;
				// Try to extract GPS from EXIF
				const extracted = await this.extractGPSFromImage(this.capturedImage);
				if (extracted) {
					loading.dismiss();
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
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
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
					this.translate.instant('ADD_BUSINESS_FORM.LOCATION_FROM_DEVICE'),
					'success'
				);
				await this.confirmLocation();
			},
			async (error) => {
				loading.dismiss();
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
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
				this.locationCaptured = true;
				return true;
			}

			return false;
		} catch (error) {
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
				const requestResult = await Geolocation.requestPermissions();
				if (requestResult.location !== 'granted') {
					loading.dismiss();
					await this.showToast(
						this.translate.instant('ADD_BUSINESS_FORM.LOCATION_PERMISSION_DENIED'),
						'warning'
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
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_FROM_DEVICE'),
				'success'
			);

			await this.confirmLocation();

		} catch (error) {
			loading.dismiss();
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.LOCATION_ERROR'),
				'danger'
			);
		}
	}

	/**
	 * Show confirmation dialog for captured location
	 */
	async confirmLocation() {
		const alert = await this.alertController.create({
			header: this.translate.instant('ADD_BUSINESS_FORM.CONFIRM_LOCATION'),
			message: this.translate.instant('ADD_BUSINESS_FORM.LOCATION_DETAILS', {
				latitude: this.latitude.toFixed(6),
				longitude: this.longitude.toFixed(6)
			}),
			buttons: [
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.RETAKE'),
					role: 'cancel',
					handler: () => {
						this.captureShopImage();
					}
				},
				{
					text: this.translate.instant('ADD_BUSINESS_FORM.CONFIRM'),
					handler: () => {
						this.showToast(
							this.translate.instant('ADD_BUSINESS_FORM.LOCATION_CONFIRMED'),
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
				this.translate.instant('ADD_BUSINESS_FORM.CAPTURE_LOCATION_FIRST'),
				'warning'
			);
			return;
		}

		if (this.businessForm.valid) {
			const loading = await this.loadingController.create({
				message: this.isEditMode ?
					this.translate.instant('ADD_BUSINESS_FORM.UPDATING_LOCATION') :
					this.translate.instant('ADD_BUSINESS_FORM.CREATING_LOCATION')
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
					this.addBusinessService.modifyBusinessBranch(formData)
						.pipe(takeUntil(this.destroy$))
						.subscribe({
							next: async () => {
								loading.dismiss();
								await this.showToast(
									this.translate.instant('ADD_BUSINESS_FORM.UPDATE_SUCCESS'),
									'success'
								);
								this.router.navigate(['/wholesaler/business-locations']);
							},
							error: async () => {
								loading.dismiss();
								await this.showToast(
									this.translate.instant('ADD_BUSINESS_FORM.UPDATE_ERROR'),
									'danger'
								);
							}
						});
				} else {
					this.addBusinessService.createBusinessBranch(formData).subscribe({
						next: async () => {
							loading.dismiss();
							await this.showToast(
								this.translate.instant('ADD_BUSINESS_FORM.CREATE_SUCCESS'),
								'success'
							);
							this.router.navigate(['/wholesaler/business-locations']);
						},
						error: async (error: any) => {
							loading.dismiss();
							console.error('Create error:', error);
							await this.showToast(
								this.translate.instant('ADD_BUSINESS_FORM.CREATE_ERROR'),
								'danger'
							);
						}
					});
				}
			} catch (error) {
				loading.dismiss();
				console.error('Unexpected error:', error);
				await this.showToast(
					this.translate.instant('ADD_BUSINESS_FORM.UNEXPECTED_ERROR'),
					'danger'
				);
			}
		} else {
			await this.showToast(
				this.translate.instant('ADD_BUSINESS_FORM.FILL_REQUIRED_FIELDS'),
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
				return this.translate.instant('ADD_BUSINESS_FORM.FIELD_REQUIRED', { field: fieldLabel });
			}
			if (control.errors['email']) {
				return this.translate.instant('ADD_BUSINESS_FORM.INVALID_EMAIL');
			}
			if (control.errors['pattern']) {
				switch (fieldName) {
					case 'number':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_PHONE');
					case 'gstNumber':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_GST');
					case 'pan':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_PAN');
					case 'establishedYear':
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_YEAR');
					default:
						return this.translate.instant('ADD_BUSINESS_FORM.INVALID_VALUE');
				}
			}
		}
		return '';
	}

	goBack() {
		this.router.navigate(['/wholesaler/business-locations']);
	}
}